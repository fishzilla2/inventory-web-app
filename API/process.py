import io
import json
import pandas as pd
from fastapi import UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional


async def process_inventory(
    file: UploadFile = File(...),
    quantity_col: str = Form("Quantity"),
    type_col: str = Form("Type"),
    size_col: str = Form("Size"),
    code_col: str = Form("Code"),
    options: Optional[str] = Form("{}")
):
    try:
        options_dict = json.loads(options)
    except:
        options_dict = {
            'skipDuplicateHeaders': True,
            'validateCodePattern': True,
            'autoCleanTypes': True
        }

    config = {
        'quantity_col': quantity_col,
        'type_col': type_col,
        'size_col': size_col,
        'code_col': code_col,
    }

    file_content = await file.read()

    try:
        result = _process_excel(file_content, config, options_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{traceback.format_exc()}")

    stats_header = json.dumps(result['stats'])

    return StreamingResponse(
        io.BytesIO(result['output']),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="processed_inventory.xlsx"',
            "X-Processing-Stats": stats_header,
        }
    )


def _process_excel(file_content, config, options):
    df = pd.read_excel(io.BytesIO(file_content))

    if options.get('skipDuplicateHeaders', True) and len(df) > 0:
        second_row = df.iloc[0].astype(str).tolist()
        headers = [str(col).strip() for col in df.columns]
        if all(h == v.strip() for h, v in zip(headers, second_row)):
            df = df.iloc[1:].reset_index(drop=True)

    df.columns = [str(col).strip() for col in df.columns]

    col_map = {}
    for src, dst in [
        (config['quantity_col'], 'Quantity'),
        (config['type_col'], 'Type'),
        (config['size_col'], 'Size'),
        (config['code_col'], 'Code'),
    ]:
        if src in df.columns:
            col_map[src] = dst

    df = df.rename(columns=col_map)

    for col in ['Quantity', 'Type', 'Size', 'Code']:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce').fillna(0)
    df['Type'] = df['Type'].astype(str).str.strip().str.upper() if options.get('autoCleanTypes', True) else df['Type'].astype(str).str.strip()
    df['Size'] = df['Size'].astype(str).str.strip()
    df['Code'] = df['Code'].astype(str).str.strip().str.upper()

    df = df[~df['Code'].isin(['NAN', '', 'CODE'])]

    validation_errors = []
    if options.get('validateCodePattern', True):
        for idx, row in df.iterrows():
            expected = f"{row['Type']}-{row['Size']}"
            if row['Code'] != expected:
                validation_errors.append(f"Row {idx + 1}: Code '{row['Code']}' should be '{expected}'")

    stats = {
        'total_rows': len(df),
        'unique_codes': df['Code'].nunique(),
        'total_quantity': int(df['Quantity'].sum()),
        'validation_warnings': len(validation_errors)
    }

    summary = df.groupby(['Type', 'Size', 'Code'], as_index=False).agg({'Quantity': 'sum'}).sort_values(['Type', 'Size', 'Code']) if len(df) > 0 else pd.DataFrame(columns=['Type', 'Size', 'Code', 'Quantity'])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        summary.to_excel(writer, sheet_name='Summary', index=False)
        df.to_excel(writer, sheet_name='Cleaned Data', index=False)
        if validation_errors:
            pd.DataFrame({'Validation Errors': validation_errors}).to_excel(writer, sheet_name='Validation Errors', index=False)
        df[['Quantity', 'Type', 'Size', 'Code']].to_excel(writer, sheet_name='Reimport Ready', index=False)

    output.seek(0)
    return {'output': output.getvalue(), 'stats': stats}