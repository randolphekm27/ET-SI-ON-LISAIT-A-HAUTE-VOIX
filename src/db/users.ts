import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null,
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error while syncing user:', error);
    throw new Error('Impossible de synchroniser le profil utilisateur.', {
      cause: error,
    });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database error while loading user:', error);
    throw new Error('Impossible de consulter le profil utilisateur.', {
      cause: error,
    });
  }
}

export async function promoteUserToOrganizer(uid: string) {
  try {
    const updated = await db
      .update(users)
      .set({ role: 'organizer', updatedAt: new Date() })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('Database error while updating user role:', error);
    throw new Error("Impossible d'accorder l'accès organisateur.", {
      cause: error,
    });
  }
}
