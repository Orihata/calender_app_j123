/**
 * Match (試合予定) モデル
 * 
 * 試合に関する情報を表す基本エンティティ。
 * CSVファイルからインポートされ、カレンダーに表示される。
 */
export class Match {
  /**
   * @param {Object} data - 試合予定データ
   * @param {string} data.id - 試合の一意な識別子（UUID推奨）
   * @param {string|null} data.dateTime - 試合の日時（ISO 8601形式）。Kickoffが「未定」の場合はnull
   * @param {string} data.date - 試合の日付（YYYY-MM-DD形式）
   * @param {string} data.kickoff - キックオフ時間（HH:MM形式または"未定"）
   * @param {string} data.homeTeam - ホームチーム名
   * @param {string} data.awayTeam - アウェイチーム名
   * @param {string} [data.venue] - 会場名（スタジアム名）
   * @param {string} [data.group] - グループ（EAST/WEST等）
   * @param {string} [data.round] - ラウンド番号
   * @param {string} [data.broadcast] - 放送局情報
   * @param {string} [data.additionalInfo] - その他の情報
   * @param {string} data.createdAt - 作成日時（ISO 8601形式）
   * @param {string} data.updatedAt - 更新日時（ISO 8601形式）
   */
  constructor(data) {
    this.id = data.id
    this.dateTime = data.dateTime ?? null
    this.date = data.date
    this.kickoff = data.kickoff
    this.homeTeam = data.homeTeam
    this.awayTeam = data.awayTeam
    this.venue = data.venue || null
    this.group = data.group || null
    this.round = data.round || null
    this.broadcast = data.broadcast || null
    this.additionalInfo = data.additionalInfo || null
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  /**
   * MatchオブジェクトをJSON形式に変換
   * @returns {Object} JSON形式のMatchオブジェクト
   */
  toJSON() {
    return {
      id: this.id,
      dateTime: this.dateTime,
      date: this.date,
      kickoff: this.kickoff,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      venue: this.venue,
      group: this.group,
      round: this.round,
      broadcast: this.broadcast,
      additionalInfo: this.additionalInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * JSON形式からMatchオブジェクトを生成
   * @param {Object} json - JSON形式のMatchデータ
   * @returns {Match} Matchインスタンス
   */
  static fromJSON(json) {
    return new Match(json)
  }

  /**
   * 試合の表示用タイトルを生成
   * @returns {string} "ホームチーム vs アウェイチーム" 形式の文字列
   */
  getTitle() {
    return `${this.homeTeam} vs ${this.awayTeam}`
  }

  /**
   * 試合の表示用日時を生成
   * @returns {string} 日時文字列（キックオフが未定の場合は日付のみ）
   */
  getDisplayDateTime() {
    if (this.kickoff === '未定' || !this.dateTime) {
      return `${this.date} 未定`
    }
    return this.dateTime
  }
}
