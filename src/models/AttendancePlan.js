/**
 * AttendancePlan (観戦予定) モデル
 * 
 * ユーザーが観戦する予定の試合を表す。Matchへの参照を持つ。
 * カテゴリ: 'venue' (現地観戦予定) または 'broadcast' (放送視聴予定)
 */
export class AttendancePlan {
  /**
   * @param {Object} data - 観戦予定データ
   * @param {string} data.id - 観戦予定の一意な識別子（UUID推奨）
   * @param {string} data.matchId - 関連する試合予定のID（Match.idへの参照）
   * @param {string} data.category - カテゴリ ('venue' | 'broadcast')
   * @param {string|null} [data.memo] - ひとことメモ（オプション）
   * @param {string} data.createdAt - 作成日時（ISO 8601形式）
   * @param {string} data.updatedAt - 更新日時（ISO 8601形式）
   */
  constructor(data) {
    this.id = data.id
    this.matchId = data.matchId
    this.category = data.category || 'venue' // デフォルトは現地観戦予定
    this.memo = data.memo || null // ひとことメモ（追加）
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  /**
   * AttendancePlanオブジェクトをJSON形式に変換
   * @returns {Object} JSON形式のAttendancePlanオブジェクト
   */
  toJSON() {
    return {
      id: this.id,
      matchId: this.matchId,
      category: this.category,
      memo: this.memo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * カテゴリの表示名を取得
   * @returns {string} カテゴリの表示名
   */
  getCategoryLabel() {
    return this.category === 'venue' ? '現地観戦予定' : '放送視聴予定'
  }

  /**
   * JSON形式からAttendancePlanオブジェクトを生成
   * @param {Object} json - JSON形式のAttendancePlanデータ
   * @returns {AttendancePlan} AttendancePlanインスタンス
   */
  static fromJSON(json) {
    return new AttendancePlan({
      ...json,
      memo: json.memo || null // 既存データとの互換性を確保
    })
  }
}
