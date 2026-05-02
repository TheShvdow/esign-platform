/**
 * Seed idempotent : comptes de démonstration (admin + rôles workflow + utilisateur).
 *
 * Usage (depuis apps/backend, .env chargé comme pour TypeORM) :
 *   npm run db:seed
 *
 * Variables optionnelles :
 *   SEED_UPDATE=false     — ne pas réécrire mot de passe / rôle si l’email existe déjà
 *   SEED_ADMIN_EMAIL      — défaut admin@esign.local
 *   SEED_ADMIN_PASSWORD   — défaut AdminEsign2026!
 *   SEED_DEFAULT_PASSWORD — mot de passe pour les autres comptes seed (défaut UserEsign2026!)
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import type { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { UserRole } from '../types/global.types';

type SeedAccount = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password: string;
};

const BCRYPT_ROUNDS = 12;

function buildAccounts(): SeedAccount[] {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@esign.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminEsign2026!';
  const defaultPassword =
    process.env.SEED_DEFAULT_PASSWORD ?? 'UserEsign2026!';

  return [
    {
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'Plateforme',
      role: UserRole.ADMIN,
      password: adminPassword,
    },
    {
      email: 'user@esign.local',
      firstName: 'Alice',
      lastName: 'Utilisateur',
      role: UserRole.USER,
      password: defaultPassword,
    },
    {
      email: 'manager@esign.local',
      firstName: 'Marc',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      password: defaultPassword,
    },
    {
      email: 'director@esign.local',
      firstName: 'Sophie',
      lastName: 'Direction',
      role: UserRole.DIRECTOR,
      password: defaultPassword,
    },
    {
      email: 'validator@esign.local',
      firstName: 'Jean',
      lastName: 'Validateur',
      role: UserRole.VALIDATOR,
      password: defaultPassword,
    },
  ];
}

async function upsertUser(
  repo: Repository<User>,
  acc: SeedAccount,
  updateExisting: boolean,
): Promise<void> {
  const passwordHash = await bcrypt.hash(acc.password, BCRYPT_ROUNDS);
  const existing = await repo.findOne({
    where: { email: acc.email },
    select: ['id', 'email'],
  });

  if (!existing) {
    const user = repo.create({
      email: acc.email,
      firstName: acc.firstName,
      lastName: acc.lastName,
      passwordHash,
      role: acc.role,
      isActive: true,
      emailVerified: true,
      mfaEnabled: false,
    });
    await repo.save(user);
    console.log(`[seed] créé  ${acc.email} (${acc.role})`);
    return;
  }

  if (!updateExisting) {
    console.log(`[seed] ignoré (existe) ${acc.email} — SEED_UPDATE=false`);
    return;
  }

  await repo.update(
    { id: existing.id },
    {
      passwordHash,
      role: acc.role,
      firstName: acc.firstName,
      lastName: acc.lastName,
      isActive: true,
      emailVerified: true,
    },
  );
  console.log(`[seed] mis à jour ${acc.email} (${acc.role})`);
}

async function main(): Promise<void> {
  const updateExisting = process.env.SEED_UPDATE !== 'false';
  console.log(
    `[seed] SEED_UPDATE=${updateExisting} (mettre SEED_UPDATE=false pour ne pas écraser les comptes existants)`,
  );

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);

  try {
    for (const acc of buildAccounts()) {
      await upsertUser(repo, acc, updateExisting);
    }
    console.log('[seed] terminé.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('[seed] erreur:', err);
  process.exit(1);
});
