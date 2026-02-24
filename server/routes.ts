import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertCustomerSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Customer routes
  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const result = await storage.createOrUpdateCustomer(validatedData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.get("/api/customers", async (req, res) => {
    // Basic auth for admin view (should be more robust in production)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer admin123`) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const allCustomers = await storage.getCustomers();
      
      // Filtering
      let filtered = allCustomers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                            c.contactNumber.includes(search);
        
        let matchesDate = true;
        if (dateFrom || dateTo) {
          const visitDate = new Date(c.createdAt);
          // Format visit date as YYYY-MM-DD for string comparison
          const vYear = visitDate.getFullYear();
          const vMonth = String(visitDate.getMonth() + 1).padStart(2, '0');
          const vDay = String(visitDate.getDate()).padStart(2, '0');
          const visitDateString = `${vYear}-${vMonth}-${vDay}`;

          if (dateFrom) {
            // dateFrom is already in YYYY-MM-DD format from frontend
            if (visitDateString < dateFrom) matchesDate = false;
          }
          if (dateTo) {
            // dateTo is already in YYYY-MM-DD format from frontend
            if (visitDateString > dateTo) matchesDate = false;
          }
        }
        
        return matchesSearch && matchesDate;
      });

      // Sorting
      filtered.sort((a: any, b: any) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (valA < valB) return -1 * sortOrder;
        if (valA > valB) return 1 * sortOrder;
        return 0;
      });

      const total = filtered.length;
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      res.json({
        customers: paginated,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Menu items routes
  app.get("/api/menu-items", async (req, res) => {
    try {
      const categoryQuery = (req.query.category as string) || (req.params as any).category;
      console.log(`[API] Fetching menu items for category: ${categoryQuery}`);

      if (categoryQuery) {
        const items = await storage.getMenuItemsByCategory(categoryQuery);
        return res.json(items);
      }

      // No category param, return all items
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu-items/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getMenuItemsByCategory(category);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items by category" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const items = await storage.getCartItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      await storage.clearCart();
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Fix veg/non-veg classification
  app.post("/api/fix-veg-classification", async (req, res) => {
    try {
      const result = await storage.fixVegNonVegClassification();
      res.json({
        message: `Fixed ${result.updated} items`,
        updated: result.updated,
        details: result.details
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fix veg classification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
