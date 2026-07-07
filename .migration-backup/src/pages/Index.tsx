const Index = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 text-center bg-background border-b">
        <h1 className="text-3xl font-bold tracking-tight">WAR ROOM — Crypto Trading Intelligence</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
          AI-powered trading signals, advanced analytics, and real-time decision intelligence for crypto traders. Professional-grade tools to trade smarter, not harder.
        </p>
      </div>
      <iframe
        src="/war-room.html"
        className="flex-1 w-full border-none"
        title="WAR ROOM ∷ Decision Intelligence"
      />
    </div>
  );
};

export default Index;