import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Role } from "@pong-ping/shared";

export type MatchHistoryKind = "match" | "rollback";

@Entity("User")
export class User {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { nullable: true })
  name!: string | null;

  @Index({ unique: true })
  @Column("text", { nullable: true })
  email!: string | null;

  @Column({ type: "timestamp", nullable: true })
  emailVerified!: Date | null;

  @Column("text", { nullable: true })
  image!: string | null;

  @Index({ unique: true })
  @Column("text", { nullable: true })
  googleId!: string | null;

  @Column("text", { nullable: true })
  avatarUrl!: string | null;

  @Column({
    type: "enum",
    enumName: "Role",
    enum: ["superadmin", "admin", "user"],
    default: "user",
  })
  role!: Role;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @OneToOne(() => PlayerRanking, (ranking) => ranking.user)
  playerRanking?: PlayerRanking | null;
}

@Entity("Account")
@Index(["provider", "providerAccountId"], { unique: true })
export class OAuthAccount {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  userId!: string;

  @Column("text")
  type!: string;

  @Column("text")
  provider!: string;

  @Column("text")
  providerAccountId!: string;

  @Column("text", { nullable: true })
  refresh_token!: string | null;

  @Column("text", { nullable: true })
  access_token!: string | null;

  @Column("integer", { nullable: true })
  expires_at!: number | null;

  @Column("text", { nullable: true })
  token_type!: string | null;

  @Column("text", { nullable: true })
  scope!: string | null;

  @Column("text", { nullable: true })
  id_token!: string | null;

  @Column("text", { nullable: true })
  session_state!: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}

@Entity("Session")
export class Session {
  @PrimaryColumn("text")
  id!: string;

  @Index({ unique: true })
  @Column("text")
  sessionToken!: string;

  @Index()
  @Column("text")
  userId!: string;

  @Column({ type: "timestamp" })
  expires!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}

@Entity("VerificationToken")
@Index(["identifier", "token"], { unique: true })
export class VerificationToken {
  @PrimaryColumn("text")
  identifier!: string;

  @Index({ unique: true })
  @PrimaryColumn("text")
  token!: string;

  @Column({ type: "timestamp" })
  expires!: Date;
}

@Entity("AuditLog")
export class AuditLog {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text", { nullable: true })
  actorUserId!: string | null;

  @Index()
  @Column("text", { nullable: true })
  targetUserId!: string | null;

  @Index()
  @Column("text")
  action!: string;

  @Column("jsonb", { nullable: true })
  metadata!: unknown;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "actorUserId" })
  actor?: User | null;
}

@Entity("AllowedEmail")
export class AllowedEmail {
  @PrimaryColumn("text")
  id!: string;

  @Index({ unique: true })
  @Column("text")
  email!: string;

  @Index()
  @Column("text", { nullable: true })
  createdByUserId!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "createdByUserId" })
  createdBy?: User | null;
}

@Entity("AuthInvitation")
export class AuthInvitation {
  @PrimaryColumn("text")
  id!: string;

  @Index({ unique: true })
  @Column("text")
  tokenHash!: string;

  @Index()
  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @Column("boolean", { default: true })
  oneTimeUse!: boolean;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  usedAt!: Date | null;

  @Column("text", { nullable: true })
  usedByEmail!: string | null;

  @Index()
  @Column("text", { nullable: true })
  createdByUserId!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "createdByUserId" })
  createdBy?: User | null;
}

@Entity("PlayerRanking")
export class PlayerRanking {
  @PrimaryColumn("text")
  id!: string;

  @Index({ unique: true })
  @Column("text")
  userId!: string;

  @Index()
  @Column("integer", { default: 1000 })
  elo!: number;

  @Index()
  @Column("integer", { default: 0 })
  wins!: number;

  @Column("integer", { default: 0 })
  total_matches!: number;

  @Column("double precision", { default: 0 })
  winRate!: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.playerRanking, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}

@Entity("RankLevel")
export class RankLevel {
  @PrimaryColumn("text")
  id!: string;

  @Index({ unique: true })
  @Column("text")
  name!: string;

  @Index({ unique: true })
  @Column("integer")
  minElo!: number;

  @Column("text")
  iconImgKey!: string;
}

@Entity("PingPongRoom")
export class PingPongRoom {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;

  @Index()
  @Column("text")
  createdById!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "createdById" })
  createdBy!: User;
}

@Entity("PingPongRoomParticipant")
@Index(["roomId", "userId"], { unique: true })
@Index(["roomId", "queuePosition"], { unique: true })
export class PingPongRoomParticipant {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  roomId!: string;

  @Index()
  @Column("text")
  userId!: string;

  @Column("integer")
  queuePosition!: number;

  @CreateDateColumn({ type: "timestamp" })
  joinedAt!: Date;

  @ManyToOne(() => PingPongRoom, { onDelete: "CASCADE" })
  @JoinColumn({ name: "roomId" })
  room!: PingPongRoom;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}

@Entity("PingPongRoomInvitation")
export class PingPongRoomInvitation {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  roomId!: string;

  @Index({ unique: true })
  @Column("text")
  token!: string;

  @Index()
  @Column("text")
  createdById!: string;

  @Index()
  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @Column("boolean", { default: false })
  oneTimeUse!: boolean;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  usedAt!: Date | null;

  @Column("text", { nullable: true })
  usedByUserId!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @ManyToOne(() => PingPongRoom, { onDelete: "CASCADE" })
  @JoinColumn({ name: "roomId" })
  room!: PingPongRoom;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "createdById" })
  createdBy!: User;
}

@Entity("MatchHistory")
export class MatchHistory {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text", { nullable: true })
  roomId!: string | null;

  @Index()
  @Column("text")
  winnerId!: string;

  @Index()
  @Column("text")
  loserId!: string;

  @Index()
  @Column("text")
  createdById!: string;

  @Index({ unique: true })
  @Column("text", { nullable: true })
  rollbackOfId!: string | null;

  @Index()
  @Column({
    type: "enum",
    enumName: "MatchHistoryKind",
    enum: ["match", "rollback"],
    default: "match",
  })
  kind!: MatchHistoryKind;

  @Column("integer")
  kFactor!: number;

  @Column("integer")
  winnerOldElo!: number;

  @Column("integer")
  winnerNewElo!: number;

  @Column("integer")
  winnerDiffPoints!: number;

  @Column("integer")
  loserOldElo!: number;

  @Column("integer")
  loserNewElo!: number;

  @Column("integer")
  loserDiffPoints!: number;

  @Index()
  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @CreateDateColumn({ type: "timestamp" })
  finishedAt!: Date;

  @ManyToOne(() => PingPongRoom, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "roomId" })
  room?: PingPongRoom | null;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "winnerId" })
  winner!: User;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "loserId" })
  loser!: User;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "createdById" })
  createdBy!: User;

  @ManyToOne(() => MatchHistory, (match) => match.rollbacks, {
    onDelete: "RESTRICT",
    nullable: true,
  })
  @JoinColumn({ name: "rollbackOfId" })
  rollbackOf?: MatchHistory | null;

  @OneToMany(() => MatchHistory, (match) => match.rollbackOf)
  rollbacks!: MatchHistory[];
}

export const entities = [
  User,
  OAuthAccount,
  Session,
  VerificationToken,
  AuditLog,
  AllowedEmail,
  AuthInvitation,
  PlayerRanking,
  RankLevel,
  MatchHistory,
  PingPongRoom,
  PingPongRoomParticipant,
  PingPongRoomInvitation,
];
