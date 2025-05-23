"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Toaster, toast } from "sonner";
import {
  Loader2,
  Clock,
  RefreshCw,
  Users,
  BarChart4,
  CheckCircle,
  LogOut,
  Clock8,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function AdminQRGenerator() {
  const router = useRouter();

  // Auth state
  const [adminPassword, setAdminPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  // QR state
  const [qrData, setQrData] = useState("");
  const [isPulsing, setIsPulsing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [qrType, setQrType] = useState("check-in");

  // Settings state
  const [settings, setSettings] = useState({
    maxQrValiditySeconds: 1800, // 30 minutes
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Stats state
  interface LatestCheckIn {
    _id: string;
    email: string;
    checkInTime: string;
    student: {
      name: string;
      regno?: string;
    };
  }

  interface WeeklyStat {
    day: string;
    attendance: number;
    rate: number;
  }

  interface QrStats {
    todayCheckins: number;
    todayCheckouts: number;
    activeSessions: number;
    totalStudents: number;
    uniqueAttendees: number;
    attendanceRate: number;
    avgDuration: number;
    weeklyStats: WeeklyStat[];
    latestCheckIns: LatestCheckIn[];
  }

  const [qrStats, setQrStats] = useState<QrStats | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Time tracking for progress bar
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Refs for intervals
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Authenticate admin
  interface AuthResponse {
    success: boolean;
    message?: string;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!adminPassword) {
      toast.error("Please enter the admin password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/attendance/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPassword }),
      });

      const data: AuthResponse = await response.json();

      if (data.success) {
        setAuthenticated(true);
        sessionStorage.setItem("adminAuthenticated", "true");
        sessionStorage.setItem("adminPassword", adminPassword);
        toast.success("Authentication successful");
        
        // Fetch settings
        fetchSettings();
      } else {
        toast.error(data.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Error authenticating:", error);
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async () => {
    // Prevent multiple simultaneous requests
    if (isGenerating) return;

    try {
      setIsGenerating(true);

      // Create payload
      const payload = {
        adminPassword,
        type: qrType,
      };

      const response = await fetch("/api/attendance/admin/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setQrData(data.qrData);
        setIsPulsing(true);
        setRefreshCount((prev) => prev + 1);
        setTimeout(() => setIsPulsing(false), 500);
      } else {
        console.error("Failed to generate QR code:", data.message);
        toast.error(data.message || "Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Error generating QR code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQrType = () => {
    const newType = qrType === "check-in" ? "check-out" : "check-in";
    setQrType(newType);
    // Force an immediate QR generation with the new type
    setTimeout(() => generateQR(), 100);
  };

  // Fetch attendance settings
  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/attendance/admin/settings?password=${adminPassword}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
      } else {
        toast.error(data.message || "Failed to fetch settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    }
  };

  // Save attendance settings
  const saveSettings = async () => {
    try {
      setLoading(true);
      
      const response = await fetch("/api/attendance/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminPassword,
          settings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Settings updated successfully");
        setSettingsOpen(false);
      } else {
        toast.error(data.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch QR statistics
  const fetchQrStats = async () => {
    try {
      setDataLoading(true);
      const response = await fetch(
        `/api/attendance/admin/stats?password=${adminPassword}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setQrStats(data.stats);
      } else {
        toast.error(data.message || "Failed to fetch attendance statistics");
      }
    } catch (error) {
      console.error("Error fetching QR stats:", error);
      toast.error("Failed to load attendance statistics");
    } finally {
      setDataLoading(false);
    }
  };

  // Go to dashboard
  const goToDashboard = () => {
    router.push("/attendance-admin-dashboard");
  };

  // Format date and time
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid time";
    }
  };

  // Format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Check for existing authentication on component mount
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    const storedPassword = sessionStorage.getItem("adminPassword");

    if (isAuthenticated === "true" && storedPassword) {
      setAuthenticated(true);
      setAdminPassword(storedPassword);
    }
    
    // Cleanup all intervals on unmount
    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, []);

  // Set up QR refresh interval - every 2 seconds
  useEffect(() => {
    if (authenticated) {
      // Generate QR immediately
      generateQR();
      
      // Set up 2-second refresh interval
      qrIntervalRef.current = setInterval(() => {
        generateQR();
      }, 2000);
      
      return () => {
        if (qrIntervalRef.current) {
          clearInterval(qrIntervalRef.current);
        }
      };
    }
  }, [authenticated, qrType]);

  // Set up progress bar update - faster than QR refresh
  useEffect(() => {
    if (!authenticated) return;

    // Progress bar for visualizing time until next refresh
    // 5 updates per 2-second cycle (roughly every 400ms)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 20; // Increment by 20% every 400ms
        return newProgress > 100 ? 0 : newProgress;
      });
    }, 400);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [authenticated]);

  // Set up stats refresh interval - every 60 seconds
  useEffect(() => {
    if (authenticated) {
      // Fetch stats immediately
      fetchQrStats();
      
      // Set up 60-second stats refresh interval
      statsIntervalRef.current = setInterval(() => {
        fetchQrStats();
      }, 60000); // 60 seconds
      
      return () => {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current);
        }
      };
    }
  }, [authenticated]);

  // Initial setup when authenticated
  useEffect(() => {
    if (authenticated) {
      fetchSettings();
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Toaster richColors position="top-center" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-black border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-center bg-gradient-to-b from-neutral-200 to-purple-500 bg-clip-text text-transparent">
                Admin Authentication
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                Enter the admin password to generate attendance QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Admin Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Authenticate"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-center text-xs text-gray-500">
              This page is for administrators only
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <Toaster richColors position="top-center" />

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-black border-purple-500/30 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Attendance Settings</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure attendance settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="qr-validity" className="text-white">QR Code Validity (minutes)</Label>
              <Input
                id="qr-validity"
                type="number"
                value={settings.maxQrValiditySeconds / 60}
                onChange={(e) => 
                  setSettings({...settings, maxQrValiditySeconds: parseInt(e.target.value) * 60 || 1800})
                }
                min={1}
                max={120}
                className="bg-gray-900 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400">
                How long each QR code remains valid after generation (default: 30 minutes)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveSettings}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-b from-neutral-200 to-purple-500 bg-clip-text text-transparent mb-2">
                QR Code Generator
              </h1>
              <p className="text-gray-400 text-sm">
                Generate QR codes for student attendance check-in/out
              </p>
            </div>
            <div className="flex mt-4 md:mt-0 space-x-2">
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={goToDashboard}
              >
                <BarChart4 className="h-4 w-4 mr-2" />
                View Dashboard
              </Button>
              <Button
                variant="outline"
                className="border-gray-700 text-gray-400 hover:bg-gray-800"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-gray-700 text-gray-400 hover:bg-gray-800"
                onClick={fetchQrStats}
                disabled={dataLoading}
              >
                {dataLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - QR Code */}
            <div className="lg:col-span-2">
              <Card className="bg-black border-purple-500/30">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl bg-gradient-to-b from-neutral-200 to-purple-500 bg-clip-text text-transparent">
                        {qrType === "check-in" ? "Check-In" : "Check-Out"} QR Code
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Students scan this code to mark attendance
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        qrType === "check-in"
                          ? "bg-green-900/20 text-green-400 border-green-500/30"
                          : "bg-blue-900/20 text-blue-400 border-blue-500/30"
                      }
                    >
                      {qrType === "check-in"
                        ? "Check In Mode"
                        : "Check Out Mode"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {/* Countdown display */}
                  <div className="mb-4 w-full">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>QR Refresh Progress</span>
                      <span>
                        <Clock className="h-3 w-3 inline mr-1" />
                        Refreshes in {Math.max(0, Math.ceil((100 - progress) / 100 * 2))} sec
                      </span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>

                  {/* QR Code */}
                  <div
                    className={`bg-white p-8 rounded-lg mb-6 transition-all ${
                      isPulsing
                        ? "scale-105 shadow-lg shadow-purple-500/20"
                        : "scale-100"
                    }`}
                  >
                    {isGenerating && !qrData ? (
                      <div className="w-64 h-64 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                      </div>
                    ) : qrData ? (
                      <>
                        {/* Clear type indicator above the QR code */}
                        <div
                          className="text-center mb-2 font-bold text-lg"
                          style={{
                            color:
                              qrType === "check-in" ? "#16a34a" : "#2563eb",
                          }}
                        >
                          {qrType === "check-in" ? "CHECK IN" : "CHECK OUT"}
                        </div>

                        <QRCodeSVG
                          value={qrData}
                          size={256}
                          level="H"
                          includeMargin={true}
                          fgColor={
                            qrType === "check-in" ? "#16a34a" : "#2563eb"
                          }
                        />
                      </>
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-gray-200">
                        <p className="text-gray-500">QR code not generated</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-4">
                    <Alert className="bg-gray-900/40 border-purple-500/30">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <AlertTitle className="text-white">
                        QR Code Information
                      </AlertTitle>
                      <AlertDescription className="text-gray-400">
                        This code refreshes every 2 seconds and remains valid for {settings.maxQrValiditySeconds / 60} minutes after generation.
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        className={
                          qrType === "check-in"
                            ? "border-green-500/30 text-green-500 hover:bg-green-950/30"
                            : "border-blue-500/30 text-blue-500 hover:bg-blue-950/30"
                        }
                        onClick={toggleQrType}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Switch to{" "}
                        {qrType === "check-in" ? "Check Out" : "Check In"}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-700 text-gray-400 hover:bg-gray-800"
                        onClick={generateQR}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {/* Today's Stats */}
              <Card className="bg-black border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">
                    Today&apos;s Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dataLoading ? (
                    <div className="h-40 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                  ) : qrStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 p-3 rounded-lg border border-green-500/30">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <div className="text-xs text-gray-400">
                                Check-ins
                              </div>
                              <div className="text-xl font-bold text-white">
                                {qrStats.todayCheckins}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-900/50 p-3 rounded-lg border border-blue-500/30">
                          <div className="flex items-center space-x-2">
                            <LogOut className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="text-xs text-gray-400">
                                Check-outs
                              </div>
                              <div className="text-xl font-bold text-white">
                                {qrStats.todayCheckouts}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-900/50 p-3 rounded-lg border border-purple-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-5 w-5 text-purple-500" />
                          <div>
                            <div className="text-xs text-gray-400">
                              Attendance Rate
                            </div>
                            <div className="text-xl font-bold text-white">
                              {qrStats.attendanceRate}% (
                              {qrStats.uniqueAttendees}/{qrStats.totalStudents})
                            </div>
                          </div>
                        </div>
                        <Progress
                          value={qrStats.attendanceRate}
                          className="h-1.5 bg-gray-800"
                        />
                      </div>

                      <div className="bg-gray-900/50 p-3 rounded-lg border border-amber-500/30">
                        <div className="flex items-center space-x-2">
                          <Clock8 className="h-5 w-5 text-amber-500" />
                          <div>
                            <div className="text-xs text-gray-400">
                              Avg. Duration
                            </div>
                            <div className="text-xl font-bold text-white">
                              {formatDuration(qrStats.avgDuration)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-400">
                        <div>
                          Active Sessions:{" "}
                          <span className="text-white">
                            {qrStats.activeSessions}
                          </span>
                        </div>
                        <div>
                          Total Students:{" "}
                          <span className="text-white">
                            {qrStats.totalStudents}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No stats available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              {qrStats?.latestCheckIns && qrStats.latestCheckIns.length > 0 && (
                <Card className="bg-black border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-gray-200">
                      Recent Check-ins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {qrStats.latestCheckIns.map((checkIn, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 py-2 border-b border-gray-800"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {checkIn.student?.name?.[0] || checkIn.email[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {checkIn.student?.name || "Unknown Student"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {checkIn.student?.regno || checkIn.email}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatTime(checkIn.checkInTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}