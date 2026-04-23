import { useState } from "react";
import { Caps, Card, Chip } from "../components/primitives";
import { C } from "../lib/tokens";

function CorrCell({ value }) {
  const v = parseFloat(value), abs = Math.abs(v);
  return (
    <td style={{
      padding:"12px 16px", textAlign:"center",
      fontFamily:"var(--tf-font-sans)", fontVariantNumeric:"tabular-nums",
      fontSize:13, fontWeight:600,
      background: v >= 0 ? `rgba(5,150,105,${abs * .25})` : `rgba(220,38,38,${abs * .25})`,
      color: abs > .7 ? (v >= 0 ? C.greenDk : C.redDk)
           : abs > .3 ? (v >= 0 ? C.green : C.red)
           : C.sub,
    }}>
      {v.toFixed(2)}
    </td>
  );
}

export function Correlation({ portfolios, pfColors, corrMatrix, corrPfIdx, setCorrPfIdx }) {
  return (
    <div style={{ padding:"32px 40px", maxWidth:1200, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <Caps style={{ marginBottom:8 }}>Correlation</Caps>
        <h1 style={{ margin:0, fontFamily:"var(--tf-font-sans)", fontWeight:800,
          fontSize:36, letterSpacing:"-0.03em", lineHeight:1.1, color:C.text }}>
          Asset correlation matrix
        </h1>
        <p style={{ margin:"6px 0 0", fontFamily:"var(--tf-font-sans)", fontSize:14, color:C.muted, maxWidth:620 }}>
          How assets in this portfolio move together. Lower correlations mean better diversification.
          Calculated from period returns over the selected timeframe.
        </p>
      </div>

      {/* Portfolio selector */}
      {portfolios.length > 1 && (
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {portfolios.map((pf, i) => (
            <Chip key={i} active={corrPfIdx === i} size="md"
              onClick={() => setCorrPfIdx(i)}>
              {pf.name}
            </Chip>
          ))}
        </div>
      )}

      <Card padding={0}>
        {!corrMatrix ? (
          <div style={{ padding:"60px 24px", textAlign:"center", color:C.muted,
            fontFamily:"var(--tf-font-sans)", fontSize:14 }}>
            Need at least 2 assets in the selected portfolio to compute correlations.
          </div>
        ) : (
          <>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
                <thead>
                  <tr style={{ background:C.bgAlt }}>
                    <th style={{ padding:"12px 16px", textAlign:"left", borderRight:`1px solid ${C.border}` }}>
                      <Caps>Asset</Caps>
                    </th>
                    {corrMatrix.ids.map(id => (
                      <th key={id} style={{ padding:"12px 16px", textAlign:"center" }}>
                        <span style={{ fontFamily:"var(--tf-font-sans)", fontSize:12,
                          fontWeight:700, color:C.text }}>{id}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {corrMatrix.ids.map(row => (
                    <tr key={row} style={{ borderTop:`1px solid ${C.border}` }}>
                      <td style={{ padding:"12px 16px", background:C.bgAlt,
                        borderRight:`1px solid ${C.border}` }}>
                        <span style={{ fontFamily:"var(--tf-font-sans)", fontSize:12,
                          fontWeight:700, color:C.text }}>{row}</span>
                      </td>
                      {corrMatrix.ids.map(col => (
                        <CorrCell key={col} value={corrMatrix.matrix[row][col]}/>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:"16px 22px", borderTop:`1px solid ${C.border}`,
              background:C.bgAlt, fontFamily:"var(--tf-font-sans)", fontSize:12,
              color:C.muted, lineHeight:1.7, display:"flex", gap:24, flexWrap:"wrap" }}>
              <span>
                <strong style={{ color:C.greenDk }}>+1.00</strong> · perfectly correlated
              </span>
              <span>
                <strong style={{ color:C.text }}>0.00</strong> · independent
              </span>
              <span>
                <strong style={{ color:C.redDk }}>−1.00</strong> · inversely correlated
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
