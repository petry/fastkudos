export interface AdminUserRecord {
  id: string;
  email: string;
  passwordHash: string;
}

export interface AdminUserRepo {
  findByEmail(email: string): Promise<AdminUserRecord | null>;
}

export interface EventRepo {
  existsBySlug(slug: string): Promise<boolean>;
  create(input: { name: string; slug: string; ownerId: string }): Promise<{ id: string; slug: string; name: string }>;
}

export interface FeedbackOwnership {
  /** Retorna o owner_id do evento ao qual o feedback pertence, ou null se não existir. */
  ownerOfFeedback(feedbackId: string): Promise<string | null>;
  delete(feedbackId: string): Promise<void>;
}

export interface ProfileOwnership {
  ownerOfProfile(profileId: string): Promise<string | null>;
  delete(profileId: string): Promise<void>;
}
