import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../../entities/asset.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly repo: Repository<Asset>,
  ) {}

  /**
   * List asset untuk katalog (ringkas)
   */
  async list() {
    const rows = await this.repo
      .createQueryBuilder('a')
      .select([
        'a.id as id',
        'a.kode_aset as kode_aset',
        'a.nama_aset as nama_aset',
        'a.luas_m2 as luas_m2',
        'a.nilai_aset as nilai_aset',
        'a.tahun_perolehan as tahun_perolehan',
        'a.status_hukum as status_hukum',
        'a.status_penggunaan as status_penggunaan',
        'a.alamat_lokasi as alamat_lokasi',
        'a.updated_at as updated_at',
        `ST_GeometryType(a.geometry) as geometry_type`,
      ])
      .orderBy('a.updated_at', 'DESC')
      .limit(200)
      .getRawMany();

    return rows.map((r) => ({
      id: Number(r.id),
      kode_aset: r.kode_aset,
      nama_aset: r.nama_aset,
      luas_m2: r.luas_m2,
      nilai_aset: r.nilai_aset,
      tahun_perolehan: r.tahun_perolehan,
      status_hukum: r.status_hukum,
      status_penggunaan: r.status_penggunaan,
      alamat_lokasi: r.alamat_lokasi,
      updated_at: r.updated_at,
      geometry_type: r.geometry_type, // 'ST_Point', 'ST_Polygon', null
    }));
  }

  /**
   * DETAIL asset untuk klik row (tampilkan lengkap)
   */
  async detail(id: number) {
    if (!id || Number.isNaN(id)) throw new BadRequestException('ID tidak valid');

    const asset = await this.repo.findOne({ where: { id } as any });
    if (!asset) throw new NotFoundException('Asset tidak ditemukan');

    return asset;
  }

  /**
   * UPDATE asset (edit data katalog)
   */
  async update(id: number, dto: Partial<Asset>) {
    if (!id || Number.isNaN(id)) throw new BadRequestException('ID tidak valid');

    const asset = await this.repo.findOne({ where: { id } as any });
    if (!asset) throw new NotFoundException('Asset tidak ditemukan');

    Object.assign(asset, dto);
    return this.repo.save(asset);
  }

  /**
   * DELETE asset
   */
  async remove(id: number) {
    if (!id || Number.isNaN(id)) throw new BadRequestException('ID tidak valid');

    const asset = await this.repo.findOne({ where: { id } as any });
    if (!asset) throw new NotFoundException('Asset tidak ditemukan');

    await this.repo.remove(asset);
    return { ok: true };
  }

  /**
   * Ambil seluruh asset sebagai GeoJSON FeatureCollection
   * (Point & Polygon dari PostGIS)
   */
  async geojson() {
    const rows = await this.repo
      .createQueryBuilder('a')
      .select([
        'a.id as id',
        'a.kode_aset as kode_aset',
        'a.nama_aset as nama_aset',
        'a.luas_m2 as luas_m2',
        'a.nilai_aset as nilai_aset',
        'a.tahun_perolehan as tahun_perolehan',
        'a.status_hukum as status_hukum',
        'a.status_penggunaan as status_penggunaan',
        'a.alamat_lokasi as alamat_lokasi',
        `ST_AsGeoJSON(a.geometry)::json as geometry`,
      ])
      .where('a.geometry IS NOT NULL')
      .getRawMany();

    return {
      type: 'FeatureCollection',
      features: rows.map((r) => ({
        type: 'Feature',
        geometry: r.geometry,
        properties: {
          id: r.id,
          kode_aset: r.kode_aset,
          nama_aset: r.nama_aset,
          luas_m2: r.luas_m2,
          nilai_aset: r.nilai_aset,
          tahun_perolehan: r.tahun_perolehan,
          status_hukum: r.status_hukum,
          status_penggunaan: r.status_penggunaan,
          alamat_lokasi: r.alamat_lokasi,
        },
      })),
    };
  }

  /**
   * Create asset dengan geometry POINT
   */
  async createPoint(input: {
    kode_aset: string;
    nama_aset: string;
    lat: number;
    lng: number;
    alamat_lokasi?: string;
  }) {
    const asset = this.repo.create({
      kode_aset: input.kode_aset,
      nama_aset: input.nama_aset,
      alamat_lokasi: input.alamat_lokasi,
      geometry: {
        type: 'Point',
        coordinates: [input.lng, input.lat], // GeoJSON: [lng, lat]
      } as any,
    });

    return this.repo.save(asset);
  }

  /**
   * Create asset dengan geometry POLYGON
   */
  async createPolygon(input: {
    kode_aset: string;
    nama_aset: string;
    coordinates: [number, number][];
    alamat_lokasi?: string;
  }) {
    if (!input.coordinates || input.coordinates.length < 4) {
      throw new BadRequestException('Polygon minimal memiliki 4 titik (tertutup)');
    }

    // pastikan polygon tertutup
    const coords = [...input.coordinates];
    const first = coords[0];
    const last = coords[coords.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push(first);
    }

    const asset = this.repo.create({
      kode_aset: input.kode_aset,
      nama_aset: input.nama_aset,
      alamat_lokasi: input.alamat_lokasi,
      geometry: {
        type: 'Polygon',
        coordinates: [coords], // GeoJSON Polygon = array of ring
      } as any,
    });

    return this.repo.save(asset);
  }
}
