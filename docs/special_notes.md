## 需要特別注意

- **D1 擴展性**:建議在 MVP 階段就實作資料庫分片邏輯,避免後期重構
    
- **AI 操作審計**:確保每個寫入動作都有完整的 `action_log`,這在 AI 出錯時至關重要
    
- **成本監控**:設定 Cloudflare 與 Vercel 的用量告警,避免突發流量造成財務損失
    
- **降級機制**:當 AI 服務不可用時,Web Admin 必須能獨立運作

## **Serverless Edge-first 的隱藏成本**

雖然理論上完美,但實務中存在挑戰:[meegle+1](https://www.meegle.com/en_us/topics/serverless-architecture/serverless-architecture-for-edge-computing)​

- **Cold Start 延遲**:Cloudflare Workers 表現較佳,但仍可能影響 AI 工具呼叫的即時性
    
- **供應商綁定**:深度整合 Cloudflare 生態(D1/R2/Workers)後,遷移成本高昂
    
- **成本不可預測**:用量計費在流量激增時可能造成預算失控
    
- **除錯與監控**:分散式架構的可觀測性遠不如傳統 monolith

