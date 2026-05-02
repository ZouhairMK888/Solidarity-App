USE solidarity_app;

-- Campaign-level organizers: each campaign can have one owner and many
-- additional organizers without changing the user's global account role.
CREATE TABLE campaign_organizers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('owner', 'organizer') NOT NULL DEFAULT 'organizer',
    status ENUM('active', 'removed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_campaign_organizer_campaign FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_organizer_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_campaign_organizer_user UNIQUE (campaign_id, user_id)
);

-- Backfill existing campaign creators as the campaign owner.
INSERT INTO campaign_organizers (campaign_id, user_id, role, status)
SELECT id, created_by, 'owner', 'active'
FROM campaigns
WHERE created_by IS NOT NULL
ON DUPLICATE KEY UPDATE role = 'owner', status = 'active';

-- Volunteer requests to become an organizer for a campaign.
CREATE TABLE organizer_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    motivation TEXT NOT NULL,
    experience TEXT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    reviewed_by BIGINT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_organizer_application_campaign FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_organizer_application_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_organizer_application_reviewer FOREIGN KEY (reviewed_by)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_organizer_application_user_campaign UNIQUE (campaign_id, user_id)
);

CREATE INDEX idx_campaign_organizers_campaign ON campaign_organizers(campaign_id);
CREATE INDEX idx_campaign_organizers_user ON campaign_organizers(user_id);
CREATE INDEX idx_organizer_applications_campaign ON organizer_applications(campaign_id);
CREATE INDEX idx_organizer_applications_status ON organizer_applications(status);
