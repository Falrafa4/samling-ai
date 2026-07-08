import pandas as pd

df = pd.read_csv('tps_dki.csv')
df['kecamatan'] = df['kecamatan'].astype(str).str.strip()
result = (
    df.groupby('kecamatan', dropna=False)
    .size()
    .reset_index(name='jumlah_tps')
    .sort_values(['jumlah_tps', 'kecamatan'], ascending=[False, True])
)
print(result.to_string(index=False))