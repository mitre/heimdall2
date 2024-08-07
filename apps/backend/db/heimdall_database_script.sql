SET check_function_bodies = false
;

CREATE TABLE public."ApiKeys"(
  id bigserial NOT NULL,
  "userId" bigint,
  "groupId" bigint,
  "name" character varying(255),
  "apiKey" character varying(255),
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "type" character varying(255) DEFAULT 'user'::character varying,
  CONSTRAINT "ApiKeys_pkey" PRIMARY KEY(id)
);

COMMENT ON TABLE public."ApiKeys" IS
  'Linking  (bridge) table between Users and ApiKeys';

CREATE TABLE public."Evaluations"(
  id bigserial NOT NULL,
  "userId" bigint,
  "groupId" bigint,
  "evaluationTagId" bigint,
  public boolean NOT NULL DEFAULT false,
  filename character varying(255) NOT NULL,
  "data" json NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "Evaluations_pkey" PRIMARY KEY(id)
);

COMMENT ON TABLE public."Evaluations" IS 'Evaluations attributes table';

CREATE TABLE public."EvaluationTags"(
  id bigserial NOT NULL,
  "evaluationId" bigint,
  "value" character varying(255) NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "EvaluationTags_pkey" PRIMARY KEY(id)
);

CREATE TABLE public."GroupEvaluations"(
  id bigserial NOT NULL,
  "evaluationId" bigint,
  "groupId" bigint,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "GroupEvaluations_pkey" PRIMARY KEY(id)
);

COMMENT ON TABLE public."GroupEvaluations" IS
  'Linking  (bridge) table between Groups and Evaluations';

CREATE TABLE public."Groups"(
  id bigserial NOT NULL,
  "name" character varying(255) NOT NULL,
  public boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "desc" text NOT NULL DEFAULT ''::text,
  CONSTRAINT "Groups_name_key" UNIQUE("name"),
  CONSTRAINT "Groups_pkey" PRIMARY KEY(id)
);

COMMENT ON TABLE public."Groups" IS 'Groups attributes table';

CREATE TABLE public."GroupUsers"(
  id bigserial NOT NULL,
  "userId" bigint,
  "groupId" bigint,
  "role" character varying(255) NOT NULL DEFAULT 'member'::character varying,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "GroupUsers_pkey" PRIMARY KEY(id)
);

COMMENT ON TABLE public."GroupUsers" IS
  'Linking (bridge) table between Groups and Users';

CREATE TABLE public."SequelizeMeta"(
"name" character varying(255) NOT NULL,
  CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY("name")
);

CREATE TABLE public."session"(
  sid character varying(255) NOT NULL,
  sess json NOT NULL,
  expire timestamp with time zone NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY(sid)
);

  CREATE INDEX "IDX_session_expire" ON public."session" USING btree
    (expire NULLS LAST);
  
CREATE TABLE public."Users"(
  id bigserial NOT NULL,
  email character varying(255) NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "firstName" character varying(255),
  "lastName" character varying(255),
  organization character varying(255),
  title character varying(255),
  "encryptedPassword" character varying(255) NOT NULL,
  "passwordChangedAt" character varying(255),
  "forcePasswordChange" boolean,
  "role" character varying(255) NOT NULL DEFAULT 'user'::character varying,
  "loginCount" integer,
  "lastLogin" timestamp with time zone,
  "creationMethod" character varying(255) DEFAULT 'local'::character varying,
  "jwtSecret" character varying(255),
  CONSTRAINT "Users_email_key" UNIQUE(email),
  CONSTRAINT "Users_pkey" PRIMARY KEY(id)
);

COMMENT ON TABLE public."Users" IS 'Users attributes table';

ALTER TABLE public."ApiKeys"
  ADD CONSTRAINT "ApiKeys_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES public."Groups" (id) ON DELETE Set null
      ON UPDATE Cascade;

ALTER TABLE public."ApiKeys"
  ADD CONSTRAINT "ApiKeys_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."Users" (id) ON DELETE Set null
      ON UPDATE Cascade;

ALTER TABLE public."Evaluations"
  ADD CONSTRAINT "Evaluations_evaluationTagId_fkey"
    FOREIGN KEY ("evaluationTagId") REFERENCES public."EvaluationTags" (id)
      ON DELETE Set null ON UPDATE Cascade;

ALTER TABLE public."Evaluations"
  ADD CONSTRAINT "Evaluations_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES public."Groups" (id) ON DELETE Set null
      ON UPDATE Cascade;

ALTER TABLE public."Evaluations"
  ADD CONSTRAINT "Evaluations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."Users" (id) ON DELETE Set null
      ON UPDATE Cascade;

ALTER TABLE public."EvaluationTags"
  ADD CONSTRAINT "EvaluationTags_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES public."Evaluations" (id)
      ON DELETE Set null ON UPDATE Cascade;

ALTER TABLE public."GroupEvaluations"
  ADD CONSTRAINT "GroupEvaluations_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES public."Evaluations" (id)
      ON DELETE Set null ON UPDATE Cascade;

ALTER TABLE public."GroupEvaluations"
  ADD CONSTRAINT "GroupEvaluations_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES public."Groups" (id) ON DELETE Set null
      ON UPDATE Cascade;

ALTER TABLE public."GroupUsers"
  ADD CONSTRAINT "GroupUsers_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES public."Groups" (id) ON DELETE Set null
      ON UPDATE Cascade;

ALTER TABLE public."GroupUsers"
  ADD CONSTRAINT "GroupUsers_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."Users" (id) ON DELETE Set null
      ON UPDATE Cascade;

CREATE OR REPLACE PROCEDURE public.update_group_names_transaction()
 LANGUAGE plpgsql
AS $procedure$
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
        END; $procedure$
;

