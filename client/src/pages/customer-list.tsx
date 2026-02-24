import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Loader2, LogOut, Users, Search, Calendar as CalendarIcon, ArrowUpDown } from "lucide-react";
import type { Customer } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function CustomerList() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery<{ 
    customers: Customer[]; 
    total: number; 
    page: number; 
    totalPages: number 
  }>({
    queryKey: ["/api/customers", page, searchTerm, sortConfig, dateRange],
    enabled: isLoggedIn,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });
      
      if (dateRange.from) {
        params.append("dateFrom", dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append("dateTo", dateRange.to.toISOString());
      }

      const res = await fetch(`/api/customers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer admin123`,
        },
      });
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const toggleSort = (key: keyof Customer) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1); // Reset to first page on sort
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "Barrelborn@admin" && password === "BarrelBorn@132231") {
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
        <Card className="w-full max-w-md bg-[#222] border-[#B8986A] text-[#dcd4c8]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#B8986A] text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="bg-transparent border-[#B8986A] text-[#dcd4c8] placeholder:text-[#dcd4c8]/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="bg-transparent border-[#B8986A] text-[#dcd4c8] placeholder:text-[#dcd4c8]/50"
                    required
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#B8986A] text-white hover:bg-[#a6895f] hover:text-white">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#B8986A]" />
            <h1 className="text-3xl font-bold text-[#B8986A]">Customer List</h1>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsLoggedIn(false)}
              className="border-[#B8986A] text-[#B8986A] hover:bg-[#B8986A] hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8986A]/50" />
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#222] border-[#B8986A] text-[#dcd4c8]"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal bg-[#222] border-[#B8986A] text-[#dcd4c8] hover:bg-[#2a2a2a] hover:text-white",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[#B8986A]" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Filter by date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#222] border-[#B8986A]" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
    onSelect={(range: any) => {
      if (range?.from) {
        setDateRange({ 
          from: range.from, 
          to: range.to || range.from 
        });
      } else {
        setDateRange({ from: undefined, to: undefined });
      }
    }}
                numberOfMonths={2}
                captionLayout="dropdown-buttons"
                fromYear={2020}
                toYear={new Date().getFullYear() + 1}
                className="bg-[#222] text-[#dcd4c8]"
              />
              <div className="p-2 border-t border-[#B8986A]/20 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                  className="text-[#B8986A] hover:bg-[#B8986A]/10 hover:text-white"
                >
                  Clear
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 text-sm text-[#B8986A]/70 bg-[#222] border border-[#B8986A] px-3 py-2 rounded-md">
            <span className="font-medium">Total: {total}</span>
          </div>
        </div>

        <Card className="bg-[#222] border-[#B8986A] text-[#dcd4c8]">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#B8986A]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border border-[#B8986A]/20">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#B8986A]/20 hover:bg-transparent">
                        <TableHead 
                          className="text-[#B8986A] cursor-pointer hover:text-[#dcd4c8] transition-colors"
                          onClick={() => toggleSort("name")}
                        >
                          <div className="flex items-center gap-2">
                            Name
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-[#B8986A]">Contact Number</TableHead>
                        <TableHead 
                          className="text-[#B8986A] cursor-pointer hover:text-[#dcd4c8] transition-colors"
                          onClick={() => toggleSort("visitCount")}
                        >
                          <div className="flex items-center gap-2">
                            Visits
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-[#B8986A] cursor-pointer hover:text-[#dcd4c8] transition-colors"
                          onClick={() => toggleSort("createdAt")}
                        >
                          <div className="flex items-center gap-2">
                            First Visit
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer._id.toString()} className="border-[#B8986A]/10 hover:bg-[#B8986A]/5">
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.contactNumber}</TableCell>
                          <TableCell>{customer.visitCount || 1}</TableCell>
                          <TableCell>{format(new Date(customer.createdAt), "PPP p")}</TableCell>
                        </TableRow>
                      ))}
                      {customers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 opacity-50">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="w-8 h-8 mb-2 opacity-20" />
                              No customers found
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-[#B8986A] text-[#B8986A] hover:bg-[#B8986A]/10"
                    >
                      Previous
                    </Button>
                    <div className="text-sm text-[#B8986A]/70">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-[#B8986A] text-[#B8986A] hover:bg-[#B8986A]/10"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
