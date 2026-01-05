import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #0066cc 0%, #0052a3 100%)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Fujiko Today
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
