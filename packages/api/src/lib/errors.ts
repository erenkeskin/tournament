export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'APP_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class InsufficientBalanceError extends AppError {
  constructor() {
    super('Insufficient VP balance', 400, 'INSUFFICIENT_BALANCE');
    this.name = 'InsufficientBalanceError';
  }
}

export class TeamAlreadyAssignedError extends AppError {
  constructor() {
    super('Team is already assigned and cannot be changed', 400, 'TEAM_IMMUTABLE');
    this.name = 'TeamAlreadyAssignedError';
  }
}

export class SuspendedPlayerError extends AppError {
  constructor(playerName: string) {
    super(`Player ${playerName} is suspended for this match`, 400, 'SUSPENDED_PLAYER');
    this.name = 'SuspendedPlayerError';
  }
}

export class MatchAlreadyPlayedError extends AppError {
  constructor() {
    super('Match has already been played', 400, 'MATCH_PLAYED');
    this.name = 'MatchAlreadyPlayedError';
  }
}

export class NotAdminError extends AppError {
  constructor() {
    super('Admin access required', 403, 'NOT_ADMIN');
    this.name = 'NotAdminError';
  }
}
