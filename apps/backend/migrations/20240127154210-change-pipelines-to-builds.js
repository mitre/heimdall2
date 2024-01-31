'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.createTable('Builds', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          buildId: {
            type: Sequelize.STRING,
            allowNull: false
          },
          buildType: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          branchName: {
            type: Sequelize.STRING,
            allowNull: true
          },
          groupId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Groups',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          userId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction: t }),
        queryInterface.createTable('BuildEvaluations', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          buildId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Builds',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          evaluationId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Evaluations',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction: t }),
        queryInterface.createTable('GroupBuilds', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          groupId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Groups',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          buildId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Builds',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction: t }),
        queryInterface.createTable('ProductBuilds', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          buildId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Builds',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          productId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Products',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction: t }),
        t.afterCommit(() => {
          return queryInterface.sequelize.transaction((t2) => {
            return Promise.all([
              queryInterface.sequelize.query(`
                INSERT INTO "Builds" (id, "buildId", "buildType", "branchName", "groupId", "userId", "createdAt", "updatedAt")
                SELECT id, "buildId", "buildType", "branchName", "groupId", "userId", "createdAt", "updatedAt" FROM "Pipelines";
                SELECT setval('"Builds_id_seq"',(SELECT max(id) FROM "Builds"));
              `, { transaction: t2 }),
              queryInterface.sequelize.query(`
                INSERT INTO "BuildEvaluations" (id, "buildId", "evaluationId", "createdAt", "updatedAt")
                SELECT id, "pipelineId", "evaluationId", "createdAt", "updatedAt" FROM "PipelineEvaluations";
                SELECT setval('"BuildEvaluations_id_seq"',(SELECT max(id) FROM "BuildEvaluations"));
              `, { transaction: t2 }),
              queryInterface.sequelize.query(`
                INSERT INTO "GroupBuilds" (id, "buildId", "groupId", "createdAt", "updatedAt")
                SELECT id, "pipelineId", "groupId", "createdAt", "updatedAt" FROM "GroupPipelines";
                SELECT setval('"GroupBuilds_id_seq"',(SELECT max(id) FROM "GroupBuilds"));
              `, { transaction: t2 }),
              queryInterface.sequelize.query(`
                INSERT INTO "ProductBuilds" (id, "buildId", "productId", "createdAt", "updatedAt")
                SELECT id, "pipelineId", "productId", "createdAt", "updatedAt" FROM "ProductPipelines";
                SELECT setval('"ProductBuilds_id_seq"',(SELECT max(id) FROM "ProductBuilds"));
              `, { transaction: t2 }),
              t2.afterCommit(() => {
                queryInterface.dropTable('ProductPipelines'),
                queryInterface.dropTable('GroupPipelines'),
                queryInterface.dropTable('PipelineEvaluations'),
                queryInterface.dropTable('Pipelines')
              })
            ])
          })
        })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.createTable('Pipelines', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          buildId: {
            type: Sequelize.STRING,
            allowNull: false
          },
          buildType: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          branchName: {
            type: Sequelize.STRING,
            allowNull: true
          },
          groupId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Groups',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          userId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction: t }),
        queryInterface.createTable('PipelineEvaluations', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          pipelineId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Pipelines',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          evaluationId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Evaluations',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction: t }),
        queryInterface.createTable('GroupPipelines', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          groupId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Groups',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          pipelineId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Pipelines',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction: t }),
        queryInterface.createTable('ProductPipelines', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          pipelineId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Pipelines',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          productId: {
            type: Sequelize.BIGINT,
            references: {
              model: 'Products',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction: t }),
        t.afterCommit(() => {
          return queryInterface.sequelize.transaction((t2) => {
            return Promise.all([
              queryInterface.sequelize.query(`
                INSERT INTO "Pipelines" (id, "buildId", "buildType", "branchName", "groupId", "userId", "createdAt", "updatedAt")
                SELECT id, "buildId", "buildType", "branchName", "groupId", "userId", "createdAt", "updatedAt" FROM "Builds";
                SELECT setval('"Pipelines_id_seq"',(SELECT max(id) FROM "Pipelines"));
              `, { transaction: t2 }),
              queryInterface.sequelize.query(`
                INSERT INTO "PipelineEvaluations" (id, "pipelineId", "evaluationId", "createdAt", "updatedAt")
                SELECT id, "buildId", "evaluationId", "createdAt", "updatedAt" FROM "BuildEvaluations";
                SELECT setval('"PipelineEvaluations_id_seq"',(SELECT max(id) FROM "PipelineEvaluations"));
              `, { transaction: t2 }),
              queryInterface.sequelize.query(`
                INSERT INTO "GroupPipelines" (id, "pipelineId", "groupId", "createdAt", "updatedAt")
                SELECT id, "buildId", "groupId", "createdAt", "updatedAt" FROM "GroupBuilds";
                SELECT setval('"GroupPipelines_id_seq"',(SELECT max(id) FROM "GroupPipelines"));
              `, { transaction: t2 }),
              queryInterface.sequelize.query(`
                INSERT INTO "ProductPipelines" (id, "pipelineId", "productId", "createdAt", "updatedAt")
                SELECT id, "buildId", "productId", "createdAt", "updatedAt" FROM "ProductBuilds";
                SELECT setval('"ProductPipelines_id_seq"',(SELECT max(id) FROM "ProductPipelines"));
              `, { transaction: t2 }),
              t2.afterCommit(() => {
                queryInterface.dropTable('ProductBuilds'),
                queryInterface.dropTable('GroupBuilds'),
                queryInterface.dropTable('BuildEvaluations'),
                queryInterface.dropTable('Builds')
              })
            ])
          })
        })
      ])
    })
  }
};
