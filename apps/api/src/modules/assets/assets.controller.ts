import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AssetsService } from './assets.service';

/**
 * DTO untuk POINT
 */
class CreatePointDto {
  @IsString()
  @MinLength(3)
  kode_aset: string;

  @IsString()
  @MinLength(3)
  nama_aset: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  alamat_lokasi?: string;
}

/**
 * DTO untuk POLYGON
 */
class CreatePolygonDto {
  @IsString()
  @MinLength(3)
  kode_aset: string;

  @IsString()
  @MinLength(3)
  nama_aset: string;

  /**
   * Array of [lng, lat]
   * Contoh:
   * [[107.54, -6.87], [107.55, -6.87], ...]
   */
  @IsArray()
  @IsArray({ each: true })
  coordinates: [number, number][];

  @IsOptional()
  @IsString()
  alamat_lokasi?: string;
}

/**
 * DTO untuk UPDATE asset (atribut katalog / master data)
 * NOTE: field-field ini harus ADA di entity + database supaya kesimpan.
 * Kalau belum ada kolomnya, nanti kita rapihin entity + migration.
 */
class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  kode_aset?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  nama_aset?: string;

  @IsOptional()
  @IsNumber()
  luas_m2?: number;

  @IsOptional()
  @IsNumber()
  nilai_aset?: number;

  @IsOptional()
  @IsNumber()
  tahun_perolehan?: number;

  @IsOptional()
  @IsString()
  status_hukum?: string;

  @IsOptional()
  @IsString()
  status_penggunaan?: string;

  @IsOptional()
  @IsString()
  alamat_lokasi?: string;

  // optional (kalau belum ada kolom, boleh kamu hapus dulu)
  @IsOptional()
  @IsString()
  jenis_aset?: string;

  @IsOptional()
  @IsString()
  skpd?: string;

  @IsOptional()
  @IsString()
  keterangan?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  list() {
    return this.assets.list();
  }

  @Get('geojson')
  geojson() {
    return this.assets.geojson();
  }

  // DETAIL (klik row -> tampil detail)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.assets.detail(Number(id));
  }

  // UPDATE (edit data katalog)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assets.update(Number(id), dto);
  }

  // DELETE (hapus aset)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assets.remove(Number(id));
  }

  @Post('point')
  createPoint(@Body() dto: CreatePointDto) {
    return this.assets.createPoint(dto);
  }

  @Post('polygon')
  createPolygon(@Body() dto: CreatePolygonDto) {
    return this.assets.createPolygon(dto);
  }
}
