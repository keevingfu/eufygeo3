-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "role_id" TEXT NOT NULL,
    "department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "search_volume" INTEGER,
    "difficulty" DECIMAL(5,2),
    "cpc" DECIMAL(10,2),
    "competition_level" TEXT,
    "priority_level" TEXT,
    "intent_type" TEXT,
    "product_line" TEXT,
    "stage" TEXT,
    "aio_status" TEXT DEFAULT 'not_monitored',
    "aio_first_seen_at" TIMESTAMP(3),
    "aio_coverage_score" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_metrics" (
    "id" TEXT NOT NULL,
    "keyword_id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "google_position" INTEGER,
    "google_featured_snippet" BOOLEAN NOT NULL DEFAULT false,
    "google_people_also_ask" BOOLEAN NOT NULL DEFAULT false,
    "aio_displayed" BOOLEAN NOT NULL DEFAULT false,
    "aio_position" INTEGER,
    "aio_content_snippet" TEXT,
    "organic_traffic" INTEGER,
    "organic_ctr" DECIMAL(5,2),
    "top_competitors" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "brief" TEXT,
    "content" TEXT,
    "meta_description" TEXT,
    "target_keywords" TEXT[],
    "ai_suggestions" JSONB,
    "ai_score" DECIMAL(5,2),
    "optimization_checklist" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "workflow_stage" TEXT,
    "assigned_to" TEXT,
    "reviewer_id" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "published_url" TEXT,
    "external_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "changes_summary" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workflow_type" TEXT NOT NULL,
    "stages" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "current_stage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_by" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "keyword_id" TEXT,
    "content_id" TEXT,
    "event_data" JSONB,
    "session_id" TEXT,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reports" (
    "id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "report_date" DATE NOT NULL,
    "metrics" JSONB NOT NULL,
    "by_keyword" JSONB,
    "by_content" JSONB,
    "by_channel" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "keyword_id" TEXT,
    "content_id" TEXT,
    "assigned_to" TEXT,
    "due_date" DATE,
    "estimated_hours" DECIMAL(5,2),
    "actual_hours" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContentKeywords" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "keywords_text_idx" ON "keywords"("text");

-- CreateIndex
CREATE INDEX "keywords_priority_level_idx" ON "keywords"("priority_level");

-- CreateIndex
CREATE INDEX "keywords_status_idx" ON "keywords"("status");

-- CreateIndex
CREATE INDEX "keywords_aio_status_idx" ON "keywords"("aio_status");

-- CreateIndex
CREATE INDEX "keyword_metrics_metric_date_idx" ON "keyword_metrics"("metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_metrics_keyword_id_metric_date_key" ON "keyword_metrics"("keyword_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "content_items_slug_key" ON "content_items"("slug");

-- CreateIndex
CREATE INDEX "content_items_status_idx" ON "content_items"("status");

-- CreateIndex
CREATE INDEX "content_items_channel_idx" ON "content_items"("channel");

-- CreateIndex
CREATE INDEX "content_items_published_at_idx" ON "content_items"("published_at");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_occurred_at_idx" ON "analytics_events"("occurred_at");

-- CreateIndex
CREATE INDEX "analytics_events_keyword_id_idx" ON "analytics_events"("keyword_id");

-- CreateIndex
CREATE UNIQUE INDEX "performance_reports_report_type_report_date_key" ON "performance_reports"("report_type", "report_date");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_idx" ON "tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentKeywords_AB_unique" ON "_ContentKeywords"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentKeywords_B_index" ON "_ContentKeywords"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_metrics" ADD CONSTRAINT "keyword_metrics_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "content_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentKeywords" ADD CONSTRAINT "_ContentKeywords_A_fkey" FOREIGN KEY ("A") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentKeywords" ADD CONSTRAINT "_ContentKeywords_B_fkey" FOREIGN KEY ("B") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;
