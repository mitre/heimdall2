'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.sequelize.query(`
        CREATE OR REPLACE PROCEDURE update_group_names_transaction()
        LANGUAGE plpgsql
        AS $$
        DECLARE
          check_name BOOLEAN := true;
          offset_cnt INTEGER := 1;
          processing_group TEXT := '';
          rec_group RECORD;
          dup_names NO SCROLL CURSOR FOR
            SELECT DISTINCT id, name FROM "Groups" WHERE name IN
              (SELECT name FROM(SELECT id, name, ROW_NUMBER() OVER(PARTITION BY name) AS occurrences FROM "Groups") AS duplicates
            WHERE duplicates.occurrences > 1) ORDER BY name, id;

        BEGIN
          -- Open the cursor
          OPEN dup_names;
          LOOP
            -- retrieve a row of data from the result set (cursor) into the rec_group variable
            FETCH dup_names INTO rec_group;
          -- exit when no more records are available in the result set
            EXIT WHEN NOT FOUND;

          -- Skip the first duplicate name (we only want to update subsequent dup names)
            IF rec_group.name = processing_group THEN
            -- Determine the next non-duplicate name
              WHILE check_name = true LOOP
                IF (SELECT EXISTS (SELECT name FROM "Groups" WHERE name = CONCAT(rec_group.name, '-', offset_cnt))::int = 1) THEN
                  offset_cnt := offset_cnt + 1;
                ELSE
                  check_name := false;
                END IF;
              END LOOP;
              -- Uncomment the next line when debugging
              -- RAISE NOTICE 'Updating % id % to %', rec_group.name, rec_group.id, CONCAT(rec_group.name, '-', offset_cnt);

            -- Update the table (comment when debugging)
              UPDATE "Groups" SET name = CONCAT(rec_group.name, '-', offset_cnt) WHERE id = rec_group.id;

            -- reset the controlling variables
              offset_cnt :=1;
              check_name = true;
          -- Set the group name flag to the name we are processing
            ELSE
              -- Uncomment the next line when debugging
              -- RAISE NOTICE 'Processing % id %', rec_group.name, rec_group.id;

            -- Update the controlling processing name variable
              processing_group := rec_group.name;
            END IF;
          END LOOP;
          -- close the cursor
          CLOSE dup_names;
        END; $$
        `)
        await queryInterface.sequelize.query(`CALL update_group_names_transaction()`, { transaction: t })
        await queryInterface.changeColumn('Groups', 'name', {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        }, { transaction: t })
      } catch (error) {
        await t.rollback();
        throw error;
      }
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.changeColumn('Groups', 'name', {
          type: Sequelize.STRING,
          allowNull: false,
          unique: false
        }, { transaction: t })
      ])
    })
  }
};
