import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  Tab,
  Tabs,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import { Add, Edit, Delete, Download, ShoppingCart } from "@mui/icons-material";
import axios from "axios";

interface Product {
  id: number;
  code: string;
  name: string;
  openingStock: number;
  purchases: number;
  sales: number;
  rate: number;
  gstPerc: number;
}

interface BillItem {
  productCode: string;
  productName: string;
  rate: number;
  quantity: number;
  discountPerc: number;
  gstPerc: number;
  lineTotal: number;
}

interface Bill {
  id: number;
  customerName: string;
  subtotal: number;
  gstAmount: number;
  discount: number;
  netAmount: number;
  createdAt: string;
  items: BillItem[];
  invoiceUrl?: string;
}

const API_BASE = "http://localhost:5000";

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  // Billing state
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<BillItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState(0);

  // Product dialog state
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    code: "",
    name: "",
    openingStock: 0,
    purchases: 0,
    sales: 0,
    rate: 0,
    gstPerc: 18,
  });

  useEffect(() => {
    fetchProducts();
    fetchBills();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get<Product[]>(`${API_BASE}/api/products`);
      console.log("Raw API response:", response.data);
      
      const productsWithNumbers = response.data.map(product => {
        // Calculate closing stock correctly
        const openingStock = Number(product.openingStock) || 0;
        const purchases = Number(product.purchases) || 0;
        const sales = Number(product.sales) || 0;
        
        return {
          ...product,
          openingStock: openingStock,
          purchases: purchases,
          sales: sales,
          rate: Number(product.rate) || 0,
          gstPerc: Number(product.gstPerc) || 0
        };
      });
      
      console.log("Processed products:", productsWithNumbers);
      setProducts(productsWithNumbers);
    } catch (error) {
      console.error("Error fetching products:", error);
      showMessage("Error fetching products", "error");
    }
  };

  const fetchBills = async () => {
    try {
      const response = await axios.get<Bill[]>(`${API_BASE}/api/bills`);
      setBills(response.data);
    } catch (error) {
      showMessage("Error fetching bills", "error");
    }
  };

  const showMessage = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  // Calculate closing stock for a product
  const calculateClosingStock = (product: Product): number => {
    return Number(product.openingStock) + Number(product.purchases) - Number(product.sales);
  };

  // Product Management
  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ 
        ...product,
        openingStock: Number(product.openingStock),
        purchases: Number(product.purchases),
        sales: Number(product.sales),
        rate: Number(product.rate),
        gstPerc: Number(product.gstPerc)
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        code: "",
        name: "",
        openingStock: 0,
        purchases: 0,
        sales: 0,
        rate: 0,
        gstPerc: 18,
      });
    }
    setProductDialog(true);
  };

  const saveProduct = async () => {
    try {
      setLoading(true);
      
      // Convert form values to numbers
      const productData = {
        ...productForm,
        openingStock: Number(productForm.openingStock),
        purchases: Number(productForm.purchases),
        sales: Number(productForm.sales),
        rate: Number(productForm.rate),
        gstPerc: Number(productForm.gstPerc)
      };
      
      if (editingProduct) {
        await axios.put(`${API_BASE}/api/products/${editingProduct.id}`, productData);
        showMessage("Product updated successfully", "success");
      } else {
        await axios.post(`${API_BASE}/api/products`, productData);
        showMessage("Product added successfully", "success");
      }
      fetchProducts();
      setProductDialog(false);
    } catch (error: any) {
      showMessage(error.response?.data?.error || "Error saving product", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${API_BASE}/api/products/${id}`);
        showMessage("Product deleted successfully", "success");
        fetchProducts();
      } catch (error) {
        showMessage("Error deleting product", "error");
      }
    }
  };

  // Billing Functions
  const addToCart = (product: Product) => {
    const closingStock = calculateClosingStock(product);
    
    if (closingStock <= 0) {
      showMessage("Product out of stock", "error");
      return;
    }

    const existingItem = cart.find(item => item.productCode === product.code);
    if (existingItem) {
      updateQuantity(product.code, existingItem.quantity + 1);
    } else {
      const newItem: BillItem = {
        productCode: product.code,
        productName: product.name,
        rate: Number(product.rate),
        quantity: 1,
        discountPerc: 0,
        gstPerc: Number(product.gstPerc),
        lineTotal: Number(product.rate) * (1 + Number(product.gstPerc) / 100)
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productCode: string, quantity: number) => {
    if (quantity < 1) return;
    
    const product = products.find(p => p.code === productCode);
    if (product) {
      const closingStock = calculateClosingStock(product);
      if (quantity > closingStock) {
        showMessage(`Only ${closingStock} items available`, "error");
        return;
      }
    }

    setCart(cart.map(item => 
      item.productCode === productCode 
        ? { ...item, quantity, lineTotal: calculateLineTotal({ ...item, quantity }) }
        : item
    ));
  };

  const updateDiscount = (productCode: string, discountPerc: number) => {
    if (discountPerc < 0 || discountPerc > 100) return;
    
    setCart(cart.map(item => 
      item.productCode === productCode 
        ? { ...item, discountPerc, lineTotal: calculateLineTotal({ ...item, discountPerc }) }
        : item
    ));
  };

  const calculateLineTotal = (item: BillItem): number => {
    const baseAmount = Number(item.rate) * Number(item.quantity);
    const discountAmount = baseAmount * (Number(item.discountPerc) / 100);
    const taxableAmount = baseAmount - discountAmount;
    const gstAmount = taxableAmount * (Number(item.gstPerc) / 100);
    return taxableAmount + gstAmount;
  };

  const removeFromCart = (productCode: string) => {
    setCart(cart.filter(item => item.productCode !== productCode));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      const baseAmount = Number(item.rate) * Number(item.quantity);
      const discountAmount = baseAmount * (Number(item.discountPerc) / 100);
      return sum + (baseAmount - discountAmount);
    }, 0);

    const gstAmount = cart.reduce((sum, item) => {
      const baseAmount = Number(item.rate) * Number(item.quantity);
      const discountAmount = baseAmount * (Number(item.discountPerc) / 100);
      const taxableAmount = baseAmount - discountAmount;
      return sum + (taxableAmount * (Number(item.gstPerc) / 100));
    }, 0);

    const discountAmount = subtotal * (overallDiscount / 100);
    const netAmount = subtotal - discountAmount + gstAmount;

    return { subtotal, gstAmount, discountAmount, netAmount };
  };

  const createBill = async () => {
    if (!customerName.trim()) {
      showMessage("Please enter customer name", "error");
      return;
    }
    if (cart.length === 0) {
      showMessage("Please add items to cart", "error");
      return;
    }

    try {
      setLoading(true);
      
      // Convert cart items to numbers for API
      const cartWithNumbers = cart.map(item => ({
        ...item,
        rate: Number(item.rate),
        quantity: Number(item.quantity),
        discountPerc: Number(item.discountPerc),
        gstPerc: Number(item.gstPerc),
        lineTotal: Number(item.lineTotal)
      }));
      
      const response = await axios.post<Bill>(`${API_BASE}/api/bills`, {
        customerName: customerName.trim(),
        items: cartWithNumbers,
        discount: overallDiscount
      });

      showMessage("Bill created successfully!", "success");
      setCustomerName("");
      setCart([]);
      setOverallDiscount(0);
      fetchProducts();
      fetchBills();
    } catch (error: any) {
      showMessage(error.response?.data?.error || "Error creating bill", "error");
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, gstAmount, discountAmount, netAmount } = calculateTotals();

  // Helper function to format numbers properly
  const formatNumber = (num: number): string => {
    return Number(num).toFixed(2);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <ShoppingCart style={{ marginRight: 16 }} />
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Shri Swami Samarth Paints - Billing System
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" style={{ marginTop: 24 }}>
        <Paper elevation={3}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Billing" />
            <Tab label="Product Management" />
            <Tab label="Bill History" />
          </Tabs>

          {/* Billing Tab */}
          {activeTab === 0 && (
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Customer Information
                    </Typography>
                    <TextField
                      label="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      fullWidth
                      margin="normal"
                      required
                    />
                    <TextField
                      label="Overall Discount %"
                      type="number"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(Number(e.target.value))}
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                      style={{ width: 200 }}
                      margin="normal"
                    />
                  </CardContent>
                </Card>

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <Card style={{ flex: 1, minWidth: 300 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Available Products
                      </Typography>
                      <Table size="small">
                        <TableHead style={{ backgroundColor: '#1976d2' }}>
                          <TableRow>
                            <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Code</TableCell>
                            <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Stock</TableCell>
                            <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Rate</TableCell>
                            <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {products.map((product) => {
                            const closingStock = calculateClosingStock(product);
                            return (
                              <TableRow key={product.id}>
                                <TableCell>{product.code}</TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{formatNumber(closingStock)}</TableCell>
                                <TableCell>₹{formatNumber(Number(product.rate))}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => addToCart(product)}
                                    disabled={closingStock <= 0}
                                  >
                                    Add
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card style={{ flex: 1, minWidth: 300 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Cart Items
                      </Typography>
                      {cart.length === 0 ? (
                        <Typography color="textSecondary">No items in cart</Typography>
                      ) : (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell>Qty</TableCell>
                              <TableCell>Discount%</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {cart.map((item) => (
                              <TableRow key={item.productCode}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.productCode, Number(e.target.value))}
                                    InputProps={{ inputProps: { min: 1 } }}
                                    style={{ width: 70 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={item.discountPerc}
                                    onChange={(e) => updateDiscount(item.productCode, Number(e.target.value))}
                                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                                    style={{ width: 70 }}
                                  />
                                </TableCell>
                                <TableCell>₹{formatNumber(item.lineTotal)}</TableCell>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeFromCart(item.productCode)}
                                  >
                                    <Delete />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Bill Summary
                    </Typography>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <Typography>Subtotal: ₹{formatNumber(subtotal)}</Typography>
                      </div>
                      <div>
                        <Typography>GST: ₹{formatNumber(gstAmount)}</Typography>
                      </div>
                      <div>
                        <Typography>Discount: ₹{formatNumber(discountAmount)}</Typography>
                      </div>
                      <div>
                        <Typography variant="h6" color="primary">
                          Net Amount: ₹{formatNumber(netAmount)}
                        </Typography>
                      </div>
                    </div>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={createBill}
                      disabled={loading || !customerName.trim() || cart.length === 0}
                      startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                      style={{ marginTop: 16 }}
                    >
                      {loading ? "Creating Bill..." : "Create Bill"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Product Management Tab */}
          {activeTab === 1 && (
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Typography variant="h6">Product Management</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => openProductDialog()}
                >
                  Add Product
                </Button>
              </div>

              <Table>
                <TableHead style={{ backgroundColor: '#1976d2' }}>
                  <TableRow>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Code</TableCell>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Opening Stock</TableCell>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Purchases</TableCell>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Sales</TableCell>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Closing Stock</TableCell>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Rate</TableCell>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>GST%</TableCell>
                    <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => {
                    const closingStock = calculateClosingStock(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>{product.code}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{formatNumber(Number(product.openingStock))}</TableCell>
                        <TableCell>{formatNumber(Number(product.purchases))}</TableCell>
                        <TableCell>{formatNumber(Number(product.sales))}</TableCell>
                        <TableCell>{formatNumber(closingStock)}</TableCell>
                        <TableCell>₹{formatNumber(Number(product.rate))}</TableCell>
                        <TableCell>{formatNumber(Number(product.gstPerc))}%</TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => openProductDialog(product)}
                            size="small"
                            style={{ marginRight: 8 }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => deleteProduct(product.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Bill History Tab */}
          {activeTab === 2 && (
            <div style={{ padding: 24 }}>
              <Typography variant="h6" gutterBottom>
                Bill History
              </Typography>
              {bills.length === 0 ? (
                <Typography color="textSecondary">No bills found</Typography>
              ) : (
                <Table>
                  <TableHead style={{ backgroundColor: '#1976d2' }}>
                    <TableRow>
                      <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Bill ID</TableCell>
                      <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Customer</TableCell>
                      <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Items</TableCell>
                      <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Net Amount</TableCell>
                      <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Invoice</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>{bill.id}</TableCell>
                        <TableCell>{bill.customerName}</TableCell>
                        <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{bill.items.length}</TableCell>
                        <TableCell>₹{formatNumber(bill.netAmount)}</TableCell>
                        <TableCell>
                          {bill.invoiceUrl && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Download />}
                              href={`${API_BASE}${bill.invoiceUrl}`}
                              target="_blank"
                            >
                              Download
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </Paper>

        {/* Product Dialog */}
        <Dialog open={productDialog} onClose={() => setProductDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Product Code"
              value={productForm.code}
              onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
              fullWidth
              margin="normal"
              disabled={!!editingProduct}
            />
            <TextField
              label="Product Name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Opening Stock"
              type="number"
              value={productForm.openingStock}
              onChange={(e) => setProductForm({ ...productForm, openingStock: Number(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Purchases"
              type="number"
              value={productForm.purchases}
              onChange={(e) => setProductForm({ ...productForm, purchases: Number(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Sales"
              type="number"
              value={productForm.sales}
              onChange={(e) => setProductForm({ ...productForm, sales: Number(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Rate"
              type="number"
              value={productForm.rate}
              onChange={(e) => setProductForm({ ...productForm, rate: Number(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="GST Percentage"
              type="number"
              value={productForm.gstPerc}
              onChange={(e) => setProductForm({ ...productForm, gstPerc: Number(e.target.value) })}
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProductDialog(false)}>Cancel</Button>
            <Button 
              onClick={saveProduct} 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            style={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
}

export default App;