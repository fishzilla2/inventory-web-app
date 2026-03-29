from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import json
from typing import Optional

app = FastAPI(title="Prawn Inventory Processor")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/process")
async def process_inventory(
    file: UploadFile = File(...),
    quantity_col: str = Form("Quantity"),
    type_col: str = Form("Type"),
    size_col: str = Form("Size"),
    code_col: str = Form("Code"),
    options: Optional[str] = Form("{}")
):
    try:
        opts = json.loads(options) if options else {}
        contents = await file.read()
        
        # Read Excel
        df = pd.read_excel(io.BytesIO(contents))
        
        # Skip duplicate header row if present
        if opts.get('skipDuplicateHeaders', True) and len(df) > 0:
            second_row = df.iloc[0].astype(str).tolist()
            headers = [str(col).strip() for col in df.columns]
            if all(h == v.strip() for h, v in zip(headers, second_row)):
                df = df.iloc[1:].reset_index(drop=True)
        
        # Map columns
        df.columns = [str(col).strip() for col in df.columns]
        col_map = {
            quantity_col: 'Quantity',
            type_col: 'Type',
            size_col: 'Size',
            code_col: 'Code'
        }
        df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})
        
        # Validate columns exist
        required = ['Quantity', 'Type', 'Size', 'Code']
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise HTTPException(400, f"Missing columns: {missing}. Found: {list(df.columns)}")
        
        # Clean data
        df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce').fillna(0)
        df['Type'] = df['Type'].astype(str).str.strip().str.upper()
        df['Size'] = df['Size'].astype(str).str.strip()
        df['Code'] = df['Code'].astype(str).str.strip().str.upper()
        
        # Remove empty/bad rows
        df = df[df['Code'].notna()]
        df = df[df['Code'] != '']
        df = df[df['Code'] != 'NAN']
        df = df[df['Code'] != 'CODE']
        
        # Validation
        errors = []
        if opts.get('validateCodePattern', True):
            for idx, row in df.iterrows():
                expected = f"{row['Type']}-{row['Size']}"
                if row['Code'] != expected:
                    errors.append(f"Row {idx+1}: {row['Code']} should be {expected}")
        
        # Stats
        stats = {
            "total_rows": len(df),
            "unique_codes": df['Code'].nunique(),
            "total_quantity": int(df['Quantity'].sum()),
            "validation_errors": len(errors)
        }
        
        # Create output
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Summary
            if len(df) > 0:
                summary = df.groupby(['Type', 'Size', 'Code'], as_index=False)['Quantity'].sum()
                summary = summary.sort_values(['Type', 'Size', 'Code'])
                summary.to_excel(writer, sheet_name='Summary', index=False)
            
            # Cleaned data
            df.to_excel(writer, sheet_name='Cleaned Data', index=False)
            
            # Re-import ready
            df[['Quantity', 'Type', 'Size', 'Code']].to_excel(
                writer, sheet_name='Reimport Ready', index=False
            )
            
            # Errors
            if errors:
                pd.DataFrame({'Errors': errors}).to_excel(
                    writer, sheet_name='Validation Errors', index=False
                )
        
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=processed_{file.filename}",
                "X-Processing-Stats": json.dumps(stats)
            }
        )
        
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{traceback.format_exc()}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)