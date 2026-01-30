import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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
 * DTO untuk satu koordinat [lng, lat]
 */
class CoordinateDto {
  @IsNumber()
  lng: number;

  @IsNumber()
  lat: number;
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

  @Post('point')
  createPoint(@Body() dto: CreatePointDto) {
    return this.assets.createPoint(dto);
  }

  @Post('polygon')
  createPolygon(@Body() dto: CreatePolygonDto) {
    return this.assets.createPolygon(dto);
  }
}