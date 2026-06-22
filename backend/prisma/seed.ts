import { PrismaClient, MediaStatus, WatchSessionLength } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function fetchTMDB(path: string) {
  const res = await fetch(`${TMDB_BASE}${path}?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error(`TMDB fetch failed for ${path}: ${res.status}`);
  return res.json() as Promise<any>;
}

const SESSION_WEIGHT: Record<WatchSessionLength, number> = {
  Short: 1,
  Medium: 2,
  Long: 3,
};

function calculateWeightedRating(
  updates: { rating: number; watchSessionLength: WatchSessionLength }[]
): number | null {
  if (!updates.length) return null;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const u of updates) {
    const w = SESSION_WEIGHT[u.watchSessionLength];
    weightedSum += u.rating * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

type UpdateInput = {
  lastWatched: string;
  description?: string;
  rating: number;
  watchSessionLength: WatchSessionLength;
};

async function createMediaWithUpdates(
  userId: string,
  tmdbData: any,
  mediaType: string,
  status: MediaStatus,
  updates: UpdateInput[]
) {
  const media = await prisma.media.create({
    data: {
      mediaApiId: tmdbData.id,
      mediaType,
      userId,
      title: tmdbData.name ?? tmdbData.title,
      description: tmdbData.overview,
      thumbnail: tmdbData.poster_path
        ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
        : null,
      mediaStatus: status,
    },
  });

  const createdUpdates: { rating: number; watchSessionLength: WatchSessionLength }[] = [];
  for (const u of updates) {
    await prisma.mediaUpdate.create({
      data: {
        mediaId: media.id,
        userId,
        lastWatched: u.lastWatched,
        description: u.description ?? null,
        rating: u.rating,
        watchSessionLength: u.watchSessionLength,
      },
    });
    createdUpdates.push({ rating: u.rating, watchSessionLength: u.watchSessionLength });
  }

  const userRating = calculateWeightedRating(createdUpdates);
  await prisma.media.update({ where: { id: media.id }, data: { rating: userRating } });

  return { media, userRating };
}

async function upsertMediaRating(
  mediaApiId: number,
  mediaType: string,
  userRatings: (number | null)[]
) {
  const valid = userRatings.filter((r): r is number => r !== null);
  const sum = valid.reduce((a, b) => a + b, 0);
  const count = valid.length;
  await prisma.mediaRating.upsert({
    where: { mediaApiId_mediaType: { mediaApiId, mediaType } },
    create: {
      mediaApiId,
      mediaType,
      sumOfRatings: sum,
      numberOfRatings: count,
      rating: count > 0 ? sum / count : null,
    },
    update: {
      sumOfRatings: sum,
      numberOfRatings: count,
      rating: count > 0 ? sum / count : null,
    },
  });
}

async function main() {
  console.log('Fetching media data from TMDB...');

  const [breakingBad, strangerThings, theOffice, severance, darkKnight, inception, parasite, oppenheimer] =
    await Promise.all([
      fetchTMDB('/tv/1396'),      // Breaking Bad
      fetchTMDB('/tv/66732'),     // Stranger Things
      fetchTMDB('/tv/2316'),      // The Office (US)
      fetchTMDB('/tv/95396'),     // Severance
      fetchTMDB('/movie/155'),    // The Dark Knight
      fetchTMDB('/movie/27205'),  // Inception
      fetchTMDB('/movie/496243'), // Parasite
      fetchTMDB('/movie/872585'), // Oppenheimer
    ]);

  console.log('Fetched:', [breakingBad, strangerThings, theOffice, severance, darkKnight, inception, parasite, oppenheimer]
    .map((m: any) => m.name ?? m.title)
    .join(', '));

  console.log('\nCreating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const [sarah, mike, emma, jay] = await Promise.all([
    prisma.user.create({
      data: {
        username: 'sarah_watches',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@example.com',
        passwordHash,
        bio: 'Drama queen. Procedural enthusiast. Crying at fictional characters since 1998.',
      },
    }),
    prisma.user.create({
      data: {
        username: 'movies_mike',
        firstName: 'Mike',
        lastName: 'Torres',
        email: 'mike.torres@example.com',
        passwordHash,
        bio: 'Cinephile. I see everything in theaters. Fight me.',
      },
    }),
    prisma.user.create({
      data: {
        username: 'tvbinge_emma',
        firstName: 'Emma',
        lastName: 'Walsh',
        email: 'emma.walsh@example.com',
        passwordHash,
        bio: 'On my third rewatch of The Office. Send help.',
      },
    }),
    prisma.user.create({
      data: {
        username: 'cinephile_jay',
        firstName: 'Jay',
        lastName: 'Patel',
        email: 'jay.patel@example.com',
        passwordHash,
        bio: 'Letterboxd is my love language.',
      },
    }),
  ]);

  console.log(`Created: ${sarah.username}, ${mike.username}, ${emma.username}, ${jay.username}`);

  // Ensure MediaRating rows exist before creating Media (FK requirement)
  console.log('\nEnsuring MediaRating rows exist...');
  const mediaConfigs = [
    { data: breakingBad, type: 'tv' },
    { data: strangerThings, type: 'tv' },
    { data: theOffice, type: 'tv' },
    { data: severance, type: 'tv' },
    { data: darkKnight, type: 'movie' },
    { data: inception, type: 'movie' },
    { data: parasite, type: 'movie' },
    { data: oppenheimer, type: 'movie' },
  ];
  for (const { data, type } of mediaConfigs) {
    await prisma.mediaRating.upsert({
      where: { mediaApiId_mediaType: { mediaApiId: data.id, mediaType: type } },
      create: { mediaApiId: data.id, mediaType: type },
      update: {},
    });
  }

  console.log('\nCreating media libraries and updates...');

  // ---- SARAH ----
  const { media: sarahBB, userRating: sarahBBRating } = await createMediaWithUpdates(
    sarah.id, breakingBad, 'tv', 'CurrentlyWatching',
    [
      { lastWatched: 'S1 E1-3', description: 'This show is destroying me. Walter White is a terrifying character study.', rating: 5, watchSessionLength: 'Long' },
      { lastWatched: 'S1 E4-7', description: "Can't stop watching. Jesse is breaking my heart.", rating: 5, watchSessionLength: 'Medium' },
    ]
  );

  const { media: sarahST, userRating: sarahSTRating } = await createMediaWithUpdates(
    sarah.id, strangerThings, 'tv', 'CurrentlyWatching',
    [
      { lastWatched: 'S1 E1-4', description: 'The 80s nostalgia is immaculate. Already attached to every single character.', rating: 4, watchSessionLength: 'Long' },
    ]
  );

  const { media: sarahInception, userRating: sarahInceptionRating } = await createMediaWithUpdates(
    sarah.id, inception, 'movie', 'Watched',
    [
      { lastWatched: 'Full movie', description: 'Third rewatch. Still confused about the ending, still completely obsessed.', rating: 5, watchSessionLength: 'Long' },
    ]
  );

  // Want to Watch — no updates yet
  await createMediaWithUpdates(sarah.id, severance, 'tv', 'WantToWatch', []);

  // ---- MIKE ----
  const { media: mikeDK, userRating: mikeDKRating } = await createMediaWithUpdates(
    mike.id, darkKnight, 'movie', 'Watched',
    [
      { lastWatched: 'Full movie', description: "Heath Ledger's Joker is the greatest villain performance in the history of cinema. Not up for debate.", rating: 5, watchSessionLength: 'Long' },
    ]
  );

  const { media: mikeInception, userRating: mikeInceptionRating } = await createMediaWithUpdates(
    mike.id, inception, 'movie', 'Watched',
    [
      { lastWatched: 'Full movie', description: 'Nolan at his absolute peak. The spinning top IS still spinning.', rating: 5, watchSessionLength: 'Long' },
      { lastWatched: 'Rewatch', description: 'Rewatched to settle an argument with my roommate. Still a 5/5, still won the argument.', rating: 5, watchSessionLength: 'Medium' },
    ]
  );

  const { media: mikeParasite, userRating: mikeParasiteRating } = await createMediaWithUpdates(
    mike.id, parasite, 'movie', 'Watched',
    [
      { lastWatched: 'Full movie', description: 'Completely blindsided by the third act. The best film of the decade.', rating: 5, watchSessionLength: 'Long' },
    ]
  );

  const { media: mikeOppen, userRating: mikeOppenRating } = await createMediaWithUpdates(
    mike.id, oppenheimer, 'movie', 'Watched',
    [
      { lastWatched: 'Full movie (IMAX)', description: 'The Trinity test sequence alone is worth the price of admission. Cillian Murphy carries the whole thing.', rating: 4, watchSessionLength: 'Long' },
    ]
  );

  // ---- EMMA ----
  const { media: emmaOffice, userRating: emmaOfficeRating } = await createMediaWithUpdates(
    emma.id, theOffice, 'tv', 'Watched',
    [
      { lastWatched: 'S1-S2', description: 'The British version is great but the US version absolutely perfects the format by season 2.', rating: 4, watchSessionLength: 'Long' },
      { lastWatched: 'S3-S4', description: 'The Jim and Pam storyline is genuinely stressing me out in the best possible way.', rating: 5, watchSessionLength: 'Long' },
      { lastWatched: 'S5-S7', description: 'Michael Scott is the most complex comedy character ever written. I will die on this hill.', rating: 5, watchSessionLength: 'Long' },
      { lastWatched: 'S8-S9', description: 'The post-Michael seasons are rough going but the finale absolutely sticks the landing.', rating: 3, watchSessionLength: 'Medium' },
    ]
  );

  const { media: emmaBB, userRating: emmaBBRating } = await createMediaWithUpdates(
    emma.id, breakingBad, 'tv', 'CurrentlyWatching',
    [
      { lastWatched: 'S1 E1-2', description: 'How has this been sitting on my watchlist for three years??? I am so behind.', rating: 5, watchSessionLength: 'Short' },
    ]
  );

  const { media: emmaST, userRating: emmaSTRating } = await createMediaWithUpdates(
    emma.id, strangerThings, 'tv', 'Hiatus',
    [
      { lastWatched: 'S1 all episodes', description: 'Incredible first season. Taking a short break before diving into S2.', rating: 5, watchSessionLength: 'Long' },
      { lastWatched: 'S2 E1-4', description: 'Still very good but a bit slower than S1. Will definitely continue, just not right now.', rating: 4, watchSessionLength: 'Medium' },
    ]
  );

  // ---- JAY ----
  const { media: jayDK, userRating: jayDKRating } = await createMediaWithUpdates(
    jay.id, darkKnight, 'movie', 'Watched',
    [
      { lastWatched: 'Full movie', description: 'A perfect superhero film that entirely transcends its genre. Nolan is untouchable.', rating: 5, watchSessionLength: 'Long' },
    ]
  );

  const { media: jayInception, userRating: jayInceptionRating } = await createMediaWithUpdates(
    jay.id, inception, 'movie', 'Watched',
    [
      { lastWatched: 'Full movie', description: 'Second watch. The architectural structure of this screenplay is genuinely unreal.', rating: 4, watchSessionLength: 'Long' },
    ]
  );

  const { media: jayParasite, userRating: jayParasiteRating } = await createMediaWithUpdates(
    jay.id, parasite, 'movie', 'Watched',
    [
      { lastWatched: 'Full movie', description: "Bong Joon-ho said 'let me make a film about class anxiety' and accidentally made the greatest film of the 2010s.", rating: 5, watchSessionLength: 'Long' },
    ]
  );

  const { media: jayBB, userRating: jayBBRating } = await createMediaWithUpdates(
    jay.id, breakingBad, 'tv', 'Watched',
    [
      { lastWatched: 'S1-S2', description: 'Walter White is already shaping up to be one of the greatest characters in TV history.', rating: 5, watchSessionLength: 'Long' },
      { lastWatched: 'S3-S4', description: 'Gus Fring. That is it. That is the entire review.', rating: 5, watchSessionLength: 'Long' },
      { lastWatched: 'S5 finale', description: '"I am the one who knocks." I watched the last 3 episodes in one sitting and absolutely ugly cried at the end.', rating: 5, watchSessionLength: 'Long' },
    ]
  );

  const { media: jaySev, userRating: jaySevRating } = await createMediaWithUpdates(
    jay.id, severance, 'tv', 'CurrentlyWatching',
    [
      { lastWatched: 'S1 E1-4', description: 'This show has no right being this good. Adam Scott is giving absolutely everything in every scene.', rating: 5, watchSessionLength: 'Medium' },
    ]
  );

  console.log('\nUpdating sitewide MediaRating stats...');
  await upsertMediaRating(breakingBad.id, 'tv', [sarahBBRating, emmaBBRating, jayBBRating]);
  await upsertMediaRating(strangerThings.id, 'tv', [sarahSTRating, emmaSTRating]);
  await upsertMediaRating(theOffice.id, 'tv', [emmaOfficeRating]);
  await upsertMediaRating(severance.id, 'tv', [jaySevRating]);
  await upsertMediaRating(darkKnight.id, 'movie', [mikeDKRating, jayDKRating]);
  await upsertMediaRating(inception.id, 'movie', [sarahInceptionRating, mikeInceptionRating, jayInceptionRating]);
  await upsertMediaRating(parasite.id, 'movie', [mikeParasiteRating, jayParasiteRating]);
  await upsertMediaRating(oppenheimer.id, 'movie', [mikeOppenRating]);

  console.log('\nCreating follow relationships...');
  const follows = [
    { senderId: sarah.id, recipientId: mike.id },
    { senderId: sarah.id, recipientId: emma.id },
    { senderId: sarah.id, recipientId: jay.id },
    { senderId: mike.id, recipientId: jay.id },
    { senderId: emma.id, recipientId: sarah.id },
    { senderId: emma.id, recipientId: mike.id },
    { senderId: jay.id, recipientId: sarah.id },
    { senderId: jay.id, recipientId: mike.id },
    { senderId: jay.id, recipientId: emma.id },
  ];
  for (const f of follows) {
    await prisma.follow.create({ data: f });
  }

  console.log('\nCreating comments and likes...');

  // Grab all the updates we just created for commenting/liking
  const allUpdates = await prisma.mediaUpdate.findMany({
    where: { userId: { in: [sarah.id, mike.id, emma.id, jay.id] } },
  });

  const find = (userId: string, mediaId: number, lastWatched?: string) =>
    allUpdates.find(
      (u) => u.userId === userId && u.mediaId === mediaId && (!lastWatched || u.lastWatched === lastWatched)
    );

  // Jay's BB finale update
  const jayBBFinale = find(jay.id, jayBB.id, 'S5 finale');
  if (jayBBFinale) {
    const c1 = await prisma.comment.create({ data: { updateId: jayBBFinale.id, userId: sarah.id, text: 'The finale destroyed me too. No spoilers but... THE CAR WASH SCENE. I cannot.' } });
    const c2 = await prisma.comment.create({ data: { updateId: jayBBFinale.id, userId: emma.id, text: "I'm only on S1 E2 and I'm already scared of what's coming." } });
    await prisma.updateLike.createMany({ data: [
      { updateId: jayBBFinale.id, userId: sarah.id },
      { updateId: jayBBFinale.id, userId: emma.id },
      { updateId: jayBBFinale.id, userId: mike.id },
    ]});
    await prisma.commentLike.createMany({ data: [
      { commentId: c1.id, userId: jay.id },
      { commentId: c1.id, userId: emma.id },
      { commentId: c2.id, userId: sarah.id },
    ]});
  }

  // Mike's Parasite update
  const mikePUpdate = find(mike.id, mikeParasite.id);
  if (mikePUpdate) {
    const c3 = await prisma.comment.create({ data: { updateId: mikePUpdate.id, userId: jay.id, text: "The 'respect the line' scene is a masterclass in building tension. Bong Joon-ho is a genius." } });
    const c4 = await prisma.comment.create({ data: { updateId: mikePUpdate.id, userId: sarah.id, text: 'I went in completely blind and was absolutely not prepared. Best film experience of my life.' } });
    await prisma.updateLike.createMany({ data: [
      { updateId: mikePUpdate.id, userId: jay.id },
      { updateId: mikePUpdate.id, userId: sarah.id },
    ]});
    await prisma.commentLike.createMany({ data: [
      { commentId: c3.id, userId: mike.id },
      { commentId: c4.id, userId: mike.id },
      { commentId: c4.id, userId: jay.id },
    ]});
  }

  // Emma's Michael Scott update
  const emmaOfficeMichael = find(emma.id, emmaOffice.id, 'S5-S7');
  if (emmaOfficeMichael) {
    const c5 = await prisma.comment.create({ data: { updateId: emmaOfficeMichael.id, userId: sarah.id, text: 'FINALLY someone else who appreciates the full depth of Michael Scott as a character!' } });
    await prisma.updateLike.createMany({ data: [
      { updateId: emmaOfficeMichael.id, userId: sarah.id },
      { updateId: emmaOfficeMichael.id, userId: jay.id },
    ]});
    await prisma.commentLike.create({ data: { commentId: c5.id, userId: emma.id } });
  }

  // Jay's Severance update
  const jaySevUpdate = find(jay.id, jaySev.id);
  if (jaySevUpdate) {
    const c6 = await prisma.comment.create({ data: { updateId: jaySevUpdate.id, userId: sarah.id, text: "I have this on my Want to Watch list! Should I bump it up to the top?" } });
    const c7 = await prisma.comment.create({ data: { updateId: jaySevUpdate.id, userId: mike.id, text: "Move it up immediately. The S1 finale is one of the best single hours of television I have ever seen." } });
    await prisma.updateLike.createMany({ data: [
      { updateId: jaySevUpdate.id, userId: sarah.id },
      { updateId: jaySevUpdate.id, userId: mike.id },
    ]});
    await prisma.commentLike.createMany({ data: [
      { commentId: c6.id, userId: jay.id },
      { commentId: c7.id, userId: jay.id },
      { commentId: c7.id, userId: sarah.id },
    ]});
  }

  // Sarah's first BB update
  const sarahBBFirst = find(sarah.id, sarahBB.id, 'S1 E1-3');
  if (sarahBBFirst) {
    const c8 = await prisma.comment.create({ data: { updateId: sarahBBFirst.id, userId: jay.id, text: "Oh no. Oh no no no. You are absolutely NOT ready for what is coming." } });
    const c9 = await prisma.comment.create({ data: { updateId: sarahBBFirst.id, userId: emma.id, text: "I started it the same week! I'm right there with you and I'm already consumed." } });
    await prisma.updateLike.createMany({ data: [
      { updateId: sarahBBFirst.id, userId: jay.id },
      { updateId: sarahBBFirst.id, userId: emma.id },
    ]});
    await prisma.commentLike.createMany({ data: [
      { commentId: c8.id, userId: sarah.id },
      { commentId: c8.id, userId: emma.id },
      { commentId: c9.id, userId: jay.id },
    ]});
  }

  // Sarah's Inception update
  const sarahInceptionUpdate = find(sarah.id, sarahInception.id);
  if (sarahInceptionUpdate) {
    await prisma.updateLike.createMany({ data: [
      { updateId: sarahInceptionUpdate.id, userId: mike.id },
      { updateId: sarahInceptionUpdate.id, userId: jay.id },
    ]});
  }

  // Mike's Dark Knight update
  const mikeDKUpdate = find(mike.id, mikeDK.id);
  if (mikeDKUpdate) {
    const c10 = await prisma.comment.create({ data: { updateId: mikeDKUpdate.id, userId: jay.id, text: "Agreed on every word. It also just happens to be a perfect film structurally." } });
    await prisma.updateLike.createMany({ data: [
      { updateId: mikeDKUpdate.id, userId: jay.id },
      { updateId: mikeDKUpdate.id, userId: sarah.id },
    ]});
    await prisma.commentLike.create({ data: { commentId: c10.id, userId: mike.id } });
  }

  console.log('\n✓ Seed complete!');
  console.log('  4 new users created');
  console.log('  8 new media titles seeded from TMDB');
  console.log('  Follows, comments, and likes populated');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
