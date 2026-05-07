CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"oauth_provider" text NOT NULL,
	"oauth_sub" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_provider_sub_idx" ON "users" USING btree ("oauth_provider","oauth_sub");--> statement-breakpoint
INSERT INTO "users" ("id", "email", "name", "role", "oauth_provider", "oauth_sub", "created_at")
SELECT "id", "email", "email", 'superadmin', 'legacy', "id"::text, "created_at"
FROM "admin_users"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_owner_id_admin_users_id_fk";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "user_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_event_idx" ON "profiles" USING btree ("user_id","event_id");--> statement-breakpoint
DROP TABLE IF EXISTS "admin_users";
