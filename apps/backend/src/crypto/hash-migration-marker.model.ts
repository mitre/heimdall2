import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

/**
 * ADR-006 §12 mechanism 2: the durable marker recording that PBKDF2 writes
 * have BEGUN on this database. Planted on the FIRST PBKDF2 write (§12's
 * settled planting trigger — never at install or migration time, which would
 * record something untrue): the admin bootstrap seeder's write on a fresh
 * install, or PasswordService.hash otherwise. Readers: the write-gate
 * derivation itself (sticky), the §12 mechanism-3 startup refusal
 * (HashWriteGateService.assertMarkerCompatible), and §17's authenticated
 * /health detail (e25.20).
 *
 * markerVersion is a dedicated write-epoch integer (see
 * SUPPORTED_HASH_MARKER_VERSION in hash-write-decision.ts for the
 * rationale over package.json's semver).
 */
// Decorator stacks below keep sequelize-typescript's REQUIRED order — the
// attribute modifiers first and @Column last (decorators apply bottom-up, so
// @Column must execute before @PrimaryKey/@AllowNull annotate the attribute;
// the library throws "@Column annotation is missing or annotation order is
// wrong" otherwise). perfectionist/sort-decorators wants them alphabetical,
// which the library rejects at runtime — correctness wins.
@Table
export class HashMigrationMarker extends Model {
  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare markerVersion: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare pbkdf2WritesBeganAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
