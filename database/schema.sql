CREATE DATABASE IF NOT EXISTS ogbemi_heymann CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ogbemi_heymann;

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL DEFAULT 'Administrator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  artist_email VARCHAR(255),
  press_email VARCHAR(255),
  instagram_url VARCHAR(500),
  cv_file_url VARCHAR(500),
  catalogue_file_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT only_one_site_settings CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS airtable_connections (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  api_key_encrypted TEXT,
  base_id VARCHAR(120),
  table_name VARCHAR(120) DEFAULT 'Works',
  title_field VARCHAR(120) DEFAULT 'Title',
  year_field VARCHAR(120) DEFAULT 'Year',
  dimensions_field VARCHAR(120) DEFAULT 'Dimensions',
  material_field VARCHAR(120) DEFAULT 'Material',
  series_field VARCHAR(120) DEFAULT 'Series',
  available_field VARCHAR(120) DEFAULT 'Available',
  image_field VARCHAR(120) DEFAULT 'Image',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT only_one_airtable_connection CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS exhibitions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  gallery_name VARCHAR(255),
  street_address VARCHAR(255),
  city VARCHAR(120),
  state VARCHAR(120),
  country VARCHAR(120),
  excerpt TEXT,
  description LONGTEXT,
  headlining_image_url VARCHAR(500),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_exhibitions_dates (start_date, end_date),
  INDEX idx_exhibitions_published (is_published)
);

CREATE TABLE IF NOT EXISTS exhibition_works (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exhibition_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  year VARCHAR(40),
  dimensions VARCHAR(120),
  material VARCHAR(255),
  image_url VARCHAR(500),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_exhibition_works_exhibition
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS downloadable_files (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exhibition_id BIGINT UNSIGNED NULL,
  label VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(80),
  context VARCHAR(80) NOT NULL DEFAULT 'general',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_downloadable_files_exhibition
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  cover_image_url VARCHAR(500),
  content_json JSON NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_blog_posts_published (is_published, published_at)
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  artwork_title VARCHAR(255),
  source VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS mailing_list_subscribers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings (
  id,
  artist_email,
  press_email,
  instagram_url,
  cv_file_url,
  catalogue_file_url
) VALUES (
  1,
  'ogbemi.heymann@example.com',
  'press@example.com',
  'https://www.instagram.com/',
  '/downloads/ogbemi-heymann-cv.txt',
  '/downloads/available-works-catalogue.txt'
) ON DUPLICATE KEY UPDATE id = id;
