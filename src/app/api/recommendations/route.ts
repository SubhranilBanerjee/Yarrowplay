import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'edge';

interface TasteProfile {
  genreScores: Record<string, number>;
  categoryScores: Record<string, number>;
  tagScores: Record<string, number>;
  creatorScores: Record<string, number>;
  dislikedIds: Set<string>;
  consumedIds: Set<string>;
  totalLikes: number;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {
            // Read-only for Edge GET recommendations
          },
        },
      }
    );

    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get('user_id');
    const contentType = searchParams.get('type') || 'all'; // 'all' | 'video' | 'audio' | 'blog'
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12', 10), 1), 50);

    // Resolve user (param or authenticated session)
    let userId = paramUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    const tasteProfile: TasteProfile = {
      genreScores: {},
      categoryScores: {},
      tagScores: {},
      creatorScores: {},
      dislikedIds: new Set<string>(),
      consumedIds: new Set<string>(),
      totalLikes: 0,
    };

    // If user is identified, fetch interactions to build taste profile
    if (userId) {
      // 1. Fetch user reactions (likes and dislikes)
      const { data: reactions } = await supabase
        .from('reactions')
        .select('content_type, content_id, reaction_type')
        .eq('user_id', userId);

      // 2. Fetch user favorites
      const { data: favorites } = await supabase
        .from('favorites')
        .select('content_type, content_id')
        .eq('user_id', userId);

      // 3. Fetch watch history
      const { data: history } = await supabase
        .from('watch_history')
        .select('video_id')
        .eq('user_id', userId)
        .limit(40);

      if (reactions) {
        reactions.forEach((r) => {
          if (r.reaction_type === 'dislike') {
            tasteProfile.dislikedIds.add(r.content_id);
          } else if (r.reaction_type === 'like') {
            tasteProfile.consumedIds.add(r.content_id);
            tasteProfile.totalLikes++;
          }
        });
      }

      if (favorites) {
        favorites.forEach((f) => {
          tasteProfile.consumedIds.add(f.content_id);
        });
      }

      if (history) {
        history.forEach((h) => {
          tasteProfile.consumedIds.add(h.video_id);
        });
      }

      // Collect liked/favorited content IDs to inspect their metadata
      const likedVideoIds = reactions
        ?.filter((r) => r.content_type === 'video' && r.reaction_type === 'like')
        .map((r) => r.content_id) || [];

      const likedAudioIds = reactions
        ?.filter((r) => r.content_type === 'audio' && r.reaction_type === 'like')
        .map((r) => r.content_id) || [];

      const likedBlogIds = reactions
        ?.filter((r) => r.content_type === 'blog' && r.reaction_type === 'like')
        .map((r) => r.content_id) || [];

      // Query liked videos metadata
      if (likedVideoIds.length > 0) {
        const { data: likedVideos } = await supabase
          .from('videos')
          .select('genre, category, tags, creator_id')
          .in('id', likedVideoIds.slice(0, 30));

        likedVideos?.forEach((v) => {
          if (v.genre) {
            tasteProfile.genreScores[v.genre] = (tasteProfile.genreScores[v.genre] || 0) + 3;
          }
          if (v.category) {
            tasteProfile.categoryScores[v.category] = (tasteProfile.categoryScores[v.category] || 0) + 2;
          }
          if (v.creator_id) {
            tasteProfile.creatorScores[v.creator_id] = (tasteProfile.creatorScores[v.creator_id] || 0) + 2;
          }
          if (Array.isArray(v.tags)) {
            v.tags.forEach((tag: string) => {
              const lower = tag.toLowerCase().trim();
              tasteProfile.tagScores[lower] = (tasteProfile.tagScores[lower] || 0) + 1;
            });
          }
        });
      }

      // Query liked audios metadata
      if (likedAudioIds.length > 0) {
        const { data: likedAudios } = await supabase
          .from('audios')
          .select('genre, creator_id')
          .in('id', likedAudioIds.slice(0, 30));

        likedAudios?.forEach((a) => {
          if (a.genre) {
            tasteProfile.genreScores[a.genre] = (tasteProfile.genreScores[a.genre] || 0) + 3;
          }
          if (a.creator_id) {
            tasteProfile.creatorScores[a.creator_id] = (tasteProfile.creatorScores[a.creator_id] || 0) + 2;
          }
        });
      }

      // Query liked blogs metadata
      if (likedBlogIds.length > 0) {
        const { data: likedBlogs } = await supabase
          .from('blogs')
          .select('category, tags, author_id')
          .in('id', likedBlogIds.slice(0, 30));

        likedBlogs?.forEach((b) => {
          if (b.category) {
            tasteProfile.categoryScores[b.category] = (tasteProfile.categoryScores[b.category] || 0) + 2;
          }
          if (b.author_id) {
            tasteProfile.creatorScores[b.author_id] = (tasteProfile.creatorScores[b.author_id] || 0) + 2;
          }
          if (Array.isArray(b.tags)) {
            b.tags.forEach((tag: string) => {
              const lower = tag.toLowerCase().trim();
              tasteProfile.tagScores[lower] = (tasteProfile.tagScores[lower] || 0) + 1;
            });
          }
        });
      }
    }

    // Candidate selection from published items
    const includeVideos = contentType === 'all' || contentType === 'video';
    const includeAudios = contentType === 'all' || contentType === 'audio';
    const includeBlogs = contentType === 'all' || contentType === 'blog';

    const candidates: any[] = [];

    if (includeVideos) {
      const { data: videos } = await supabase
        .from('videos')
        .select('*, creator:profiles!creator_id(id, display_name, username, avatar_url, role)')
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(40);

      if (videos) {
        candidates.push(...videos.map((v) => ({ ...v, contentType: 'video' })));
      }
    }

    if (includeAudios) {
      const { data: audios } = await supabase
        .from('audios')
        .select('*, creator:profiles!creator_id(id, display_name, username, avatar_url, role)')
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(30);

      if (audios) {
        candidates.push(...audios.map((a) => ({ ...a, contentType: 'audio' })));
      }
    }

    if (includeBlogs) {
      const { data: blogs } = await supabase
        .from('blogs')
        .select('*, author:profiles!author_id(id, display_name, username, avatar_url, role)')
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(30);

      if (blogs) {
        candidates.push(...blogs.map((b) => ({ ...b, contentType: 'blog' })));
      }
    }

    // Top genres & categories for user profile summary
    const topGenres = Object.entries(tasteProfile.genreScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    const topCategories = Object.entries(tasteProfile.categoryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const hasTasteData = topGenres.length > 0 || topCategories.length > 0 || tasteProfile.totalLikes > 0;

    // Content-Based Scoring Function
    const scoredItems = candidates
      .filter((item) => !tasteProfile.dislikedIds.has(item.id))
      .map((item) => {
        let score = 10;
        let reasons: string[] = [];

        const itemGenre = item.genre;
        const itemCategory = item.category;
        const itemCreatorId = item.creator_id || item.author_id;
        const itemTags: string[] = Array.isArray(item.tags) ? item.tags : [];

        // 1. Genre match bonus
        if (itemGenre && tasteProfile.genreScores[itemGenre]) {
          const genreBonus = Math.min(tasteProfile.genreScores[itemGenre] * 10, 40);
          score += genreBonus;
          reasons.push(`Because you like ${itemGenre}`);
        }

        // 2. Category match bonus
        if (itemCategory && tasteProfile.categoryScores[itemCategory]) {
          const catBonus = Math.min(tasteProfile.categoryScores[itemCategory] * 8, 30);
          score += catBonus;
          if (reasons.length === 0) {
            reasons.push(`Recommended in ${itemCategory}`);
          }
        }

        // 3. Creator affinity bonus
        if (itemCreatorId && tasteProfile.creatorScores[itemCreatorId]) {
          score += 25;
          const creatorName = item.creator?.display_name || item.author?.display_name;
          if (creatorName) {
            reasons.push(`From @${creatorName} whom you enjoy`);
          }
        }

        // 4. Tag overlap bonus
        let tagMatches = 0;
        for (const tag of itemTags) {
          const lower = tag.toLowerCase().trim();
          if (tasteProfile.tagScores[lower]) {
            score += 5;
            tagMatches++;
            if (tagMatches <= 1 && reasons.length < 2) {
              reasons.push(`Matches your interest in #${tag}`);
            }
          }
        }

        // 5. Popularity & Social Proof (likes and views)
        const likes = Number(item.likes_count) || 0;
        const views = Number(item.views_count) || 0;
        const popularityScore = Math.min(
          Math.log(likes + 1) * 4 + Math.log(views + 1) * 1.5,
          25
        );
        score += popularityScore;

        // 6. Recency Boost
        if (item.created_at) {
          const ageDays = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24);
          if (ageDays < 7) {
            score += 6;
          } else if (ageDays < 30) {
            score += 3;
          }
        }

        // 7. Novelty vs already consumed
        const alreadyConsumed = tasteProfile.consumedIds.has(item.id);
        if (alreadyConsumed) {
          score -= 15; // De-prioritize items user already liked or watched
        } else {
          score += 10; // Bonus for fresh recommendations
        }

        // Fallback reason for cold-start or popular items
        let finalReason = reasons[0];
        if (!finalReason) {
          if (likes > 5) {
            finalReason = `Popular with ${likes} likes on Yarrowplay`;
          } else if (itemGenre) {
            finalReason = `Trending in ${itemGenre}`;
          } else if (itemCategory) {
            finalReason = `Featured in ${itemCategory}`;
          } else {
            finalReason = 'Recommended for you';
          }
        }

        return {
          id: item.id,
          contentType: item.contentType,
          score: Math.round(score),
          reason: finalReason,
          title: item.title,
          genre: item.genre || null,
          category: item.category || null,
          thumbnail_url: item.thumbnail_url || item.cover_url || null,
          duration_seconds: item.duration_seconds || null,
          likes_count: likes,
          views_count: views,
          created_at: item.created_at,
          creator: item.creator || item.author || null,
          rawItem: item,
        };
      });

    // Sort descending by score
    scoredItems.sort((a, b) => b.score - a.score);

    const recommendations = scoredItems.slice(0, limit);

    return NextResponse.json({
      recommendations,
      profile: {
        userId: userId || null,
        isPersonalized: hasTasteData,
        topGenres,
        topCategories,
        likesAnalyzed: tasteProfile.totalLikes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Recommendation engine error' },
      { status: 500 }
    );
  }
}
