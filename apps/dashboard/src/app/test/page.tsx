"use client";

import React, { useState } from "react";
// Adjust these import paths based on your exact folder nesting
import { FeatureProvider } from "../../../../../registry/react/FeatureProvider";
import { TierGuard } from "../../../../../registry/react/TierGuard";
import { useFeatureFlag } from "../../../../../registry/react/useFeatureFlag";
import { EvaluationContext, FeatureFlagMap } from "../../../../../registry/core/types";

// --- 1. The Inner Component Testing the SDK ---
const DashboardContent = () => {
    // Testing the hook
    const showAnalytics = useFeatureFlag("beta-analytics");

    return (
        <div className="mt-8 p-6 border rounded-lg bg-white shadow-sm">
            <h2 className="text-2xl font-bold mb-4">User Dashboard</h2>

            {/* Conditionally rendered via hook */}
            {showAnalytics && (
                <div className="p-4 mb-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-md">
                    📈 Beta Analytics Feature is ACTIVE
                </div>
            )}

            {/* Conditionally rendered via TierGuard */}
            <TierGuard
                requiredTier={["pro", "enterprise"]}
                fallback={
                    <div className="p-4 bg-gray-50 border border-gray-200 text-gray-500 rounded-md">
                        🔒 Upgrade to Pro or Enterprise to access Premium Reports
                    </div>
                }
            >
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-md">
                    💎 Premium Reports Unlocked!
                </div>
            </TierGuard>
        </div>
    );
};

// --- 2. The Sandbox Wrapper ---
export default function SDKTestSandbox() {
    // Local state to simulate database changes
    const [currentTier, setCurrentTier] = useState<string>("free");
    const [flags, setFlags] = useState<FeatureFlagMap>({ "beta-analytics": false });

    // Simulate an active user/tenant context
    const mockContext: EvaluationContext = {
        id: "tenant_123",
        tier: currentTier,
    };

    const toggleAnalyticsFlag = () => {
        setFlags((prev) => ({ ...prev, "beta-analytics": !prev["beta-analytics"] }));
    };

    return (
        <div className="p-10 max-w-3xl mx-auto font-sans">
            <h1 className="text-3xl font-extrabold mb-6">SDK Interactive Sandbox</h1>

            {/* Controls to simulate product manager actions */}
            <div className="flex gap-4 mb-8 p-4 bg-gray-100 rounded-lg">
                <div>
                    <label className="block text-sm font-bold mb-2">Simulate Tier:</label>
                    <select
                        value={currentTier}
                        onChange={(e) => setCurrentTier(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="free">Free Tier</option>
                        <option value="pro">Pro Tier</option>
                        <option value="enterprise">Enterprise Tier</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">Simulate Flag:</label>
                    <button
                        onClick={toggleAnalyticsFlag}
                        className="p-2 bg-black text-white rounded hover:bg-gray-800 transition"
                    >
                        Toggle 'beta-analytics' (Currently: {flags["beta-analytics"] ? "ON" : "OFF"})
                    </button>
                </div>
            </div>

            {/* 
        The actual SDK Provider wrapping our application. 
        In a real app, this wraps the entire layout. 
      */}
            <FeatureProvider initialContext={mockContext} initialFlags={flags}>
                <DashboardContent />
            </FeatureProvider>
        </div>
    );
}