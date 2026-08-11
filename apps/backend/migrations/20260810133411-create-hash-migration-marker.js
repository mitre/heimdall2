'use strict';

/**
 * ADR-006 §12 mechanism 2 — the durable hash-migration marker table.
 *
 * This migration creates the TABLE ONLY. The marker ROW is planted on the
 * FIRST PBKDF2 write (§12's settled planting trigger: first-write, not
 * install — a row planted here would record something untrue): on a fresh
 * install that first write is the admin bootstrap seeder's (cmd.sh runs
 * db:seed:all before the app boots), otherwise PasswordService.hash plants
 * it. Readers of the marker: the write-gate derivation itself (sticky), the
 * §12 mechanism-3 startup refusal (the application refuses to start when
 * markerVersion exceeds the write epoch its code understands), and §17's
 * authenticated /health detail.
 *
 * DECISION RECORD (card heimdall2-e25.21 decision point): markerVersion is a
 * DEDICATED WRITE-EPOCH INTEGER owned by the crypto module
 * (SUPPORTED_HASH_MARKER_VERSION, currently 1 = PBKDF2-PHC writes), NOT the
 * package.json semver. Reasons: (1) the comparison's subject is
 * write-semantics capability, not package identity — an RPM Release-only
 * bump (2.13.0-1 -> 2.13.0-2) changes neither, and a same-code repackage
 * must not trip the refusal; (2) the repo's package versions are unreliable
 * for comparison (root package.json is 0.0.0, backend 2.13.0 vs frontend
 * 2.13.1 skew); (3) semver strings compare wrong lexicographically
 * ('2.13.0' < '2.9.9') and would need parsing that an integer does not.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('HashMigrationMarkers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      markerVersion: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      pbkdf2WritesBeganAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, _Sequelize) => {
    return queryInterface.dropTable('HashMigrationMarkers');
  }
};
