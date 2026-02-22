import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, LogOut, Users } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function CustomerList() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    enabled: isLoggedIn,
    meta: {
      headers: {
        Authorization: `Bearer admin123`
      }
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid password");
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
              <div className="space-y-2">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="bg-transparent border-[#B8986A] text-[#dcd4c8]"
                  required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
              <Button type="submit" className="w-full bg-[#B8986A] hover:bg-[#a6895f]">
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#B8986A]" />
            <h1 className="text-3xl font-bold text-[#B8986A]">Customer List</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsLoggedIn(false)}
            className="border-[#B8986A] text-[#B8986A] hover:bg-[#B8986A] hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="bg-[#222] border-[#B8986A] text-[#dcd4c8]">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#B8986A]" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#B8986A]/20">
                    <TableHead className="text-[#B8986A]">Name</TableHead>
                    <TableHead className="text-[#B8986A]">Contact Number</TableHead>
                    <TableHead className="text-[#B8986A]">First Visit</TableHead>
                    <TableHead className="text-[#B8986A]">Last Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer) => (
                    <TableRow key={customer._id.toString()} className="border-[#B8986A]/10">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.contactNumber}</TableCell>
                      <TableCell>{format(new Date(customer.createdAt), "PPP p")}</TableCell>
                      <TableCell>{format(new Date(customer.updatedAt), "PPP p")}</TableCell>
                    </TableRow>
                  ))}
                  {customers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 opacity-50">
                        No customers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
