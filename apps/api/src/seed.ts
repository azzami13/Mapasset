import bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';

export async function seed(ds: DataSource) {
  const roleRepo = ds.getRepository(Role);
  const userRepo = ds.getRepository(User);

  const roles = ['ADMIN', 'EDITOR', 'VIEWER'];
  for (const r of roles) {
    const exists = await roleRepo.findOne({ where: { name: r } });
    if (!exists) await roleRepo.save(roleRepo.create({ name: r }));
  }

  const adminRole = await roleRepo.findOne({ where: { name: 'ADMIN' } });
  const adminUser = await userRepo.findOne({ where: { username: 'admin' } });

  if (!adminUser) {
    const hash = await bcrypt.hash('admin123', 12);
    await userRepo.save(
      userRepo.create({
        username: 'admin',
        password_hash: hash,
        role_id: adminRole!.id,
        is_active: true,
      }),
    );
  }
}
