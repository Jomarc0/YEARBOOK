/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `type` text DEFAULT NULL,
  `date_awarded` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `achievements_user_id_index` (`user_id`),
  CONSTRAINT `achievements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'Super Administrator',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_username_unique` (`username`),
  KEY `admins_created_by_foreign` (`created_by`),
  CONSTRAINT `admins_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `albums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `albums` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `batch_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'general',
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `media_url` text DEFAULT NULL,
  `cloudinary_public_id` varchar(255) DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `albums_user_id_foreign` (`user_id`),
  KEY `albums_status_index` (`status`),
  KEY `albums_type_status_index` (`type`,`status`),
  KEY `albums_batch_id_type_status_index` (`batch_id`,`type`,`status`),
  CONSTRAINT `albums_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `albums_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `alumni_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumni_activities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `action` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `alumni_activities_user_id_action_index` (`user_id`,`action`),
  CONSTRAINT `alumni_activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'general',
  `send_push` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) unsigned NOT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `announcements_created_by_foreign` (`created_by`),
  CONSTRAINT `announcements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) unsigned DEFAULT NULL,
  `user_name` varchar(255) NOT NULL DEFAULT 'system',
  `action` varchar(255) NOT NULL,
  `details` text NOT NULL,
  `note` text DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `subject_id` bigint(20) unsigned DEFAULT NULL,
  `subject_name` varchar(100) DEFAULT NULL,
  `severity` varchar(20) DEFAULT 'info',
  `ip_address` varchar(45) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Success',
  `logged_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_admin_id_foreign` (`admin_id`),
  KEY `audit_logs_created_by_foreign` (`created_by`),
  KEY `audit_logs_subject_id_index` (`subject_id`),
  KEY `audit_logs_subject_name_index` (`subject_name`),
  CONSTRAINT `audit_logs_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `course` varchar(255) DEFAULT NULL,
  `course_code` varchar(20) DEFAULT NULL,
  `graduation_year` int(11) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `batches_course_graduation_year_unique` (`course`,`graduation_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `career_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `career_profiles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `job_title` varchar(120) DEFAULT NULL,
  `company` varchar(120) DEFAULT NULL,
  `location` varchar(120) DEFAULT NULL,
  `field` varchar(80) DEFAULT NULL,
  `bio` varchar(400) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `career_profiles_user_id_unique` (`user_id`),
  CONSTRAINT `career_profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'privacy_policy',
  `version` varchar(255) NOT NULL DEFAULT '1.0',
  `accepted` tinyint(1) NOT NULL DEFAULT 0,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `consents_user_id_type_index` (`user_id`,`type`),
  CONSTRAINT `consents_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `faculties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculties` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `graduation_albums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `graduation_albums` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `batch_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `media_url` text DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `cloudinary_public_id` varchar(255) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `graduation_albums_user_id_foreign` (`user_id`),
  KEY `graduation_albums_category_index` (`category`),
  KEY `graduation_albums_status_index` (`status`),
  KEY `graduation_albums_batch_id_index` (`batch_id`),
  CONSTRAINT `graduation_albums_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `graduation_albums_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `graduation_contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `graduation_contents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `batch_id` bigint(20) unsigned DEFAULT NULL,
  `uploaded_by` bigint(20) unsigned NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `file_path` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `cover_photo_url` varchar(255) DEFAULT NULL,
  `file_count` int(11) NOT NULL DEFAULT 1,
  `duration` varchar(255) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `graduation_contents_uploaded_by_foreign` (`uploaded_by`),
  KEY `graduation_contents_type_index` (`type`),
  KEY `graduation_contents_status_index` (`status`),
  KEY `graduation_contents_type_status_index` (`type`,`status`),
  KEY `graduation_contents_batch_id_type_status_index` (`batch_id`,`type`,`status`),
  CONSTRAINT `graduation_contents_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `graduation_contents_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `graduation_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `graduation_photos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `graduation_album_id` bigint(20) unsigned NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `cloudinary_public_id` varchar(255) DEFAULT NULL,
  `resource_type` varchar(255) NOT NULL DEFAULT 'image',
  `mime_type` varchar(255) DEFAULT NULL,
  `ai_metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ai_metadata`)),
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `graduation_photos_graduation_album_id_index` (`graduation_album_id`),
  KEY `graduation_photos_resource_type_index` (`resource_type`),
  CONSTRAINT `graduation_photos_graduation_album_id_foreign` FOREIGN KEY (`graduation_album_id`) REFERENCES `graduation_albums` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sender_id` bigint(20) unsigned NOT NULL,
  `receiver_id` bigint(20) unsigned NOT NULL,
  `body` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_sender_id_receiver_id_index` (`sender_id`,`receiver_id`),
  KEY `messages_sender_receiver_index` (`sender_id`,`receiver_id`),
  KEY `messages_receiver_read_index` (`receiver_id`,`is_read`),
  CONSTRAINT `messages_receiver_id_foreign` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `type` varchar(255) NOT NULL,
  `notifiable_type` varchar(255) NOT NULL,
  `notifiable_id` bigint(20) unsigned NOT NULL,
  `data` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'verification',
  `otp` varchar(6) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `reset_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `otp_verifications_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `album_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `public_id` varchar(255) DEFAULT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` varchar(255) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `visibility` enum('public','friends','private') NOT NULL DEFAULT 'public',
  `is_profile_post` tinyint(1) NOT NULL DEFAULT 0,
  `ai_metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ai_metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejected_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `photos_album_id_foreign` (`album_id`),
  KEY `photos_user_id_foreign` (`user_id`),
  KEY `photos_approved_by_foreign` (`approved_by`),
  KEY `photos_rejected_by_foreign` (`rejected_by`),
  CONSTRAINT `photos_album_id_foreign` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`) ON DELETE CASCADE,
  CONSTRAINT `photos_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `photos_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `photos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `post_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_media` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `photo_id` bigint(20) unsigned NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `public_id` varchar(255) DEFAULT NULL,
  `resource_type` varchar(255) NOT NULL DEFAULT 'image',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `is_reported` tinyint(1) NOT NULL DEFAULT 0,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `bytes` bigint(20) unsigned NOT NULL DEFAULT 0,
  `width` int(10) unsigned DEFAULT NULL,
  `height` int(10) unsigned DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejected_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `post_media_photo_id_foreign` (`photo_id`),
  KEY `post_media_approved_by_foreign` (`approved_by`),
  KEY `post_media_rejected_by_foreign` (`rejected_by`),
  CONSTRAINT `post_media_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `post_media_photo_id_foreign` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_media_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `profile_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile_views` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `viewed_user_id` bigint(20) unsigned NOT NULL,
  `viewer_user_id` bigint(20) unsigned DEFAULT NULL,
  `viewer_ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `profile_views_viewed_user_id_index` (`viewed_user_id`),
  KEY `profile_views_viewed_user_id_created_at_index` (`viewed_user_id`,`created_at`),
  KEY `profile_views_viewer_user_id_viewed_user_id_created_at_index` (`viewer_user_id`,`viewed_user_id`,`created_at`),
  CONSTRAINT `profile_views_viewed_user_id_foreign` FOREIGN KEY (`viewed_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `profile_views_viewer_user_id_foreign` FOREIGN KEY (`viewer_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sections` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `course` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `batch_year` smallint(5) unsigned DEFAULT NULL,
  `adviser_id` bigint(20) unsigned DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `batch_id` bigint(20) unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sections_batch_id_foreign` (`batch_id`),
  CONSTRAINT `sections_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `section_id` bigint(20) unsigned DEFAULT NULL,
  `batch_id` bigint(20) unsigned DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `student_no` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `honors` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `motto` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `photo_public_id` varchar(255) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `hometown` varchar(255) DEFAULT NULL,
  `nickname` varchar(255) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `graduation_year` smallint(5) unsigned DEFAULT NULL,
  `organizations` text DEFAULT NULL,
  `student_quote` varchar(500) DEFAULT NULL,
  `fondest_memory` text DEFAULT NULL,
  `ambition` varchar(255) DEFAULT NULL,
  `future_plans` text DEFAULT NULL,
  `message_to_batchmates` text DEFAULT NULL,
  `message_to_parents` text DEFAULT NULL,
  `most_likely_to` varchar(255) DEFAULT NULL,
  `achievements` text DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `github_url` varchar(255) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_student_no_unique` (`student_no`),
  KEY `students_section_id_foreign` (`section_id`),
  KEY `students_batch_id_foreign` (`batch_id`),
  CONSTRAINT `students_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `plan` varchar(255) NOT NULL DEFAULT 'free',
  `tier` varchar(255) NOT NULL DEFAULT 'standard',
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `paymongo_payment_intent_id` varchar(255) DEFAULT NULL,
  `amount_paid` int(11) DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_user_id_foreign` (`user_id`),
  CONSTRAINT `subscriptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tagged_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tagged_photos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `photo_id` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `uploaded_by` bigint(20) unsigned DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `similarity` double DEFAULT 0,
  `confidence` double DEFAULT 0,
  `tagged_by` bigint(20) unsigned DEFAULT NULL,
  `source` varchar(255) NOT NULL DEFAULT 'rekognition',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tagged_photos_user_id_index` (`user_id`),
  KEY `tagged_photos_uploaded_by_index` (`uploaded_by`),
  KEY `tagged_photos_tagged_by_foreign` (`tagged_by`),
  KEY `tagged_photos_photo_id_foreign` (`photo_id`),
  CONSTRAINT `tagged_photos_photo_id_foreign` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tagged_photos_tagged_by_foreign` FOREIGN KEY (`tagged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tagged_photos_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tagged_photos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `transcripts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transcripts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uploaded_by` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `audio_path` varchar(255) NOT NULL,
  `public_id` varchar(255) DEFAULT NULL,
  `transcript_text` longtext DEFAULT NULL,
  `segments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`segments`)),
  `language` varchar(20) DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `status` enum('pending','processing','done','failed') NOT NULL DEFAULT 'pending',
  `source` varchar(255) NOT NULL DEFAULT 'manual',
  `album_id` bigint(20) unsigned DEFAULT NULL,
  `graduation_photo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transcripts_public_id_unique` (`public_id`),
  KEY `transcripts_uploaded_by_foreign` (`uploaded_by`),
  KEY `transcripts_album_id_foreign` (`album_id`),
  KEY `transcripts_graduation_photo_id_foreign` (`graduation_photo_id`),
  FULLTEXT KEY `ft_transcripts_search` (`title`,`transcript_text`,`notes`),
  CONSTRAINT `transcripts_album_id_foreign` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transcripts_graduation_photo_id_foreign` FOREIGN KEY (`graduation_photo_id`) REFERENCES `graduation_photos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transcripts_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_notifications_user_id_is_read_index` (`user_id`,`is_read`),
  CONSTRAINT `user_notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_presence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_presence` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `last_seen_at` timestamp NULL DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_presence_user_id_unique` (`user_id`),
  CONSTRAINT `user_presence_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'student',
  `student_id` varchar(255) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `fcm_token` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `profile_visibility` varchar(255) NOT NULL DEFAULT 'public',
  `motto` varchar(255) DEFAULT NULL,
  `graduation_year` int(11) DEFAULT NULL,
  `batch` varchar(255) DEFAULT NULL,
  `consent_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  `google_token` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `profile_views` int(11) NOT NULL DEFAULT 0,
  `profile_picture` varchar(255) DEFAULT NULL,
  `profile_picture_public_id` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `section_id` bigint(20) unsigned DEFAULT NULL,
  `batch_id` bigint(20) unsigned DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_student_id_unique` (`student_id`),
  KEY `users_section_id_foreign` (`section_id`),
  KEY `users_batch_id_foreign` (`batch_id`),
  CONSTRAINT `users_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `voice_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voice_notes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sender_id` bigint(20) unsigned NOT NULL,
  `recipient_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `audio_url` varchar(255) NOT NULL,
  `cloudinary_public_id` varchar(255) DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reject_reason` text DEFAULT NULL,
  `reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `voice_notes_reviewed_by_foreign` (`reviewed_by`),
  KEY `voice_notes_recipient_id_status_index` (`recipient_id`,`status`),
  KEY `voice_notes_sender_id_index` (`sender_id`),
  CONSTRAINT `voice_notes_recipient_id_foreign` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `voice_notes_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `voice_notes_user_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `yearbook_bookmarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yearbook_bookmarks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `batch_id` bigint(20) unsigned NOT NULL,
  `page_index` int(10) unsigned NOT NULL,
  `label` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `yearbook_bookmarks_user_id_batch_id_page_index_unique` (`user_id`,`batch_id`,`page_index`),
  KEY `yearbook_bookmarks_user_id_batch_id_index` (`user_id`,`batch_id`),
  CONSTRAINT `yearbook_bookmarks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `yearbooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yearbooks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `batch_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'Senior Yearbook',
  `academic_year` varchar(9) DEFAULT NULL,
  `status` enum('draft','generating','published','failed') NOT NULL DEFAULT 'draft',
  `pdf_path` varchar(255) DEFAULT NULL,
  `pdf_generated_at` timestamp NULL DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `cover_url` varchar(255) DEFAULT NULL,
  `theme` varchar(255) NOT NULL DEFAULT 'classic',
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `yearbooks_batch_id_unique` (`batch_id`),
  CONSTRAINT `yearbooks_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8,'0001_01_01_000000_create_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9,'0001_01_01_000001_create_cache_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (10,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (11,'2026_03_26_172958_add_profile_picture_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (12,'2026_03_28_172838_create_faculties_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (13,'2026_03_28_174023_create_albums_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (14,'2026_03_28_174030_create_photos_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (15,'2026_03_28_182405_create_sections_table',2);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (16,'2026_03_28_182651_add_section_id_to_users_table',3);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (17,'2026_04_06_025747_add_bio_to_users_table',4);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (18,'2026_04_25_000001_add_student_id_to_users_table',5);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (19,'2026_04_25_000002_create_admins_table',6);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (20,'2026_04_25_000003_add_course_to_users_table',7);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (21,'2026_04_27_000001_add_faculty_fields_to_faculties_table',8);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (22,'2026_04_27_000002_create_audit_logs_table',8);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (23,'2026_04_27_000003_create_settings_table',8);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (24,'2026_04_29_001907_add_teaching_years_to_faculty_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (25,'2026_04_29_002336_add_teaching_years_to_users_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (26,'2026_04_29_002911_add_role_and_years_to_users_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (27,'2026_04_29_004235_split_name_in_users_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (28,'2026_05_10_000001_create_messages_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (29,'2026_05_10_000002_create_subscriptions_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (30,'2026_05_10_000003_create_transcripts_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (31,'2026_05_10_000004_create_otp_verifications_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (32,'2026_05_10_000005_create_user_notifications_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (33,'2026_05_10_000006_add_extra_fields_to_users_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (34,'2026_05_17_043326_create_personal_access_tokens_table',9);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (35,'2025_01_01_000001_create_achievements_table',10);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (36,'2026_01_01_000002_create_tagged_photos_table',11);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (37,'2026_05_10_000007_create_consents_table',12);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (38,'2026_05_10_000008_add_profile_fields_to_users_table',12);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (40,'2026_05_10_000011_create_announcements_table',12);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (41,'2026_05_10_000012_create_alumni_activities_table',12);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (42,'2026_05_18_144248_create_consents_table',12);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (43,'2026_01_01_000001_add_face_fields_to_tagged_photos',13);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (44,'2026_05_20_000110_cleanup_users_table',14);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (45,'2026_05_20_000001_add_tier_to_subscriptions_table',15);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (46,'2026_05_20_082747_add_type_to_albums_table',16);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (47,'2026_05_22_031033_add_public_id_to_photos_table',17);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (48,'2026_05_22_071727_add_user_id_to_photos_table',18);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (49,'2026_05_22_081512_add_columns_to_albums_table',19);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (50,'2026_05_22_081634_make_cover_image_nullable_in_albums_table',20);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (51,'2026_05_22_122422_add_visibility_fields_to_users_table',21);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (52,'2026_05_23_002804_create_notifications_table',21);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (53,'2026_05_23_004102_add_photo_id_to_tagged_photos_table',22);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (54,'2026_05_23_020444_create_transcripts_table',23);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (55,'2026_05_23_062045_make_uploaded_by_nullable_in_tagged_photos_table',23);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (56,'2026_05_23_065300_make_photo_path_nullable_in_tagged_photos',24);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (57,'2026_05_23_065546_create_batches_table',25);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (58,'2026_05_23_065618_add_batch_id_to_sections_and_users',26);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (59,'2026_05_23_123304_add_status_to_tagged_photos_table',27);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (60,'2026_05_24_074412_fix_audit_logs_admin_id_foreign_key',28);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (61,'2026_05_24_063921_create_albums_table',29);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (62,'2026_05_24_080519_add_profile_picture_public_id_to_users_table',30);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (63,'2026_05_24_130916_add_messaging_enhancements',31);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (64,'2026_05_25_001913_add_notes_to_transcripts',32);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (65,'2026_05_25_004651_create_yearbook_bookmarks_table',33);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (66,'2026_05_25_052542_add_public_id',34);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (68,'2026_05_10_000009_create_voice_notes_table',35);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (69,'2026_05_26_025543_create_profile_views_table',36);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (70,'2026_05_26_044153_refactor_voice_notes_table',36);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (71,'2026_05_26_053831_create_yearbooks_table',37);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (72,'2026_05_27_002137_create_career_profiles_table',38);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (73,'2026_05_28_000549_create_post_media_table',39);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (74,'2026_05_28_074423_fix_event_date_nullable_in_albums',40);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (75,'2026_05_28_120406_add_reset_fields_to_otp_verifications_table',41);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (76,'2026_05_29_000011_add_email_to_faculties_table',42);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (77,'2026_05_29_055041_change_type_column_in_achievements_table',43);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (78,'2026_05_29_062723_add_unique_public_id_to_transcripts',44);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (79,'2026_05_29_063827_add_source_and_album_id_to_transcripts',45);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (80,'2026_05_29_122612_add_moderation_columns',46);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (81,'2026_05_31_052702_create_graduation_contents_table',47);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (82,'2026_05_31_062657_add_graduation_fields_to_albums_table',48);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (83,'2026_05_31_064657_add_missing_columns_to_sections_table',49);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (84,'2026_05_31_065539_make_batch_course_fields_nullable',50);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (85,'2026_05_31_070004_create_students_table',51);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (86,'2026_06_01_015803_add_yearbook_fields_to_students_table',52);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (87,'2026_06_01_020341_add_extra_fields_to_students_table',52);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (88,'2026_06_02_013619_add_note_and_reason_to_audit_logs',53);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (89,'2026_06_02_014217_add_is_reported_to_post_media_table',54);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (90,'2026_06_02_023917_create_graduation_albums_table',55);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (91,'2026_06_02_023929_create_graduation_photos_table',55);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (92,'2026_06_03_000001_add_is_archived_to_batches_table',56);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (93,'2026_06_03_025214_add_soft_deletes_to_all_tables',56);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (94,'2026_06_03_071600_add_role_fields_to_admins_table',57);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (95,'2026_06_04_021400_add_graduation_photo_id_to_transcripts_table',58);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (96,'2026_06_04_073630_increase_google_token_column_length',59);
