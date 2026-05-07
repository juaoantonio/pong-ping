export class WinRate {
  public readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  public static fromRecord(wins: number, totalMatches: number): WinRate {
    if (totalMatches <= 0) {
      return new WinRate(0);
    }

    return new WinRate(Number(((wins / totalMatches) * 100).toFixed(2)));
  }
}
