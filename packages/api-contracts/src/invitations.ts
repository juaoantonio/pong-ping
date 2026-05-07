export interface ClaimAccessInvitationParamsDto {
  token: string;
}

export interface ClaimAccessInvitationRequestDto {
  email: string;
}

export interface ClaimAccessInvitationResponseDataDto {
  ok: true;
  email: string;
}
