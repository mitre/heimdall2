-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "ApiKeys" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" bigint,
	"groupId" bigint,
	"name" varchar(255),
	"apiKey" varchar(255),
	"type" varchar(255),
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Evaluations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"data" json NOT NULL,
	"public" boolean DEFAULT false NOT NULL,
	"userId" bigint,
	"groupId" bigint,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "EvaluationTags" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"value" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"evaluationId" bigint
);
--> statement-breakpoint
CREATE TABLE "Groups" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"public" boolean DEFAULT false NOT NULL,
	"desc" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "Groups_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "GroupUsers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"role" varchar(255) DEFAULT 'member' NOT NULL,
	"groupId" bigint,
	"userId" bigint,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "GroupUsers_groupId_userId_key" UNIQUE("groupId","userId")
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"firstName" varchar(255),
	"lastName" varchar(255),
	"organization" varchar(255),
	"title" varchar(255),
	"encryptedPassword" varchar(255) NOT NULL,
	"forcePasswordChange" boolean,
	"lastLogin" timestamp with time zone,
	"loginCount" bigint DEFAULT 0 NOT NULL,
	"passwordChangedAt" timestamp with time zone,
	"role" varchar(255) DEFAULT 'user' NOT NULL,
	"creationMethod" varchar(255) NOT NULL,
	"jwtSecret" varchar(255),
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "Users_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "GroupEvaluations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"groupId" bigint,
	"evaluationId" bigint,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "GroupEvaluations_groupId_evaluationId_key" UNIQUE("groupId","evaluationId")
);
--> statement-breakpoint
ALTER TABLE "EvaluationTags" ADD CONSTRAINT "EvaluationTags_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "public"."Evaluations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "GroupUsers" ADD CONSTRAINT "GroupUsers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "GroupUsers" ADD CONSTRAINT "GroupUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "GroupEvaluations" ADD CONSTRAINT "GroupEvaluations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "GroupEvaluations" ADD CONSTRAINT "GroupEvaluations_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "public"."Evaluations"("id") ON DELETE cascade ON UPDATE cascade;
*/