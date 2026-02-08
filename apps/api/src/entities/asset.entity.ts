import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  kode_aset: string;

  @Column({ type: 'varchar', length: 255 })
  nama_aset: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  luas_m2?: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  nilai_aset?: number;

  @Column({ type: 'int', nullable: true })
  tahun_perolehan?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status_hukum?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status_penggunaan?: string;

  @Column({ type: 'text', nullable: true })
  alamat_lokasi?: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326,
    nullable: true,
  })
  geometry?: any;

  @Column({ type: 'timestamp', default: () => 'now()' })
  updated_at: Date;
}
