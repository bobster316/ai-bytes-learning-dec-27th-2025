// Minimal test page to check if route works at all
export default async function TestAdminEditPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-4xl font-bold">TEST PAGE LOADED ✅</h1>
            <p className="text-2xl mt-4">Course ID: {id}</p>
            <p className="mt-4 text-gray-400">If you can see this, the route is working!</p>
        </div>
    );
}
