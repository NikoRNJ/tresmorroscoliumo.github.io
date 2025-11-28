import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Flow envía el token en el body como form-urlencoded
        const formData = await request.formData();
        const token = formData.get('token');

        if (!token) {
            // Fallback: intentar query param si por alguna razón llega por GET (aunque Flow usa POST por defecto para urlReturn)
            const urlToken = request.nextUrl.searchParams.get('token');
            if (urlToken) {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tresmorroscoliumo.cl';
                return NextResponse.redirect(`${siteUrl}/pago/confirmacion?token=${urlToken}`);
            }

            return NextResponse.json({ error: 'Token not found' }, { status: 400 });
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tresmorroscoliumo.cl';

        // Redirigir al frontend con el token
        // Usamos 303 See Other para convertir el POST en GET al redirigir
        return NextResponse.redirect(`${siteUrl}/pago/confirmacion?token=${token}`, { status: 303 });

    } catch (error) {
        console.error('Error handling Flow return:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
