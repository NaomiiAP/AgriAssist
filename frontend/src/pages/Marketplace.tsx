import React, { useState, useEffect } from "react";
import { Store, Package, Truck, IndianRupee, Pencil, PlusCircle, X, Search } from "lucide-react";
import axios from 'axios';

interface Crop {
  id: number;
  crop: string;
  quantity: string;
  price: string;
  location: string;
  delivery: string;
  image: string;
}

interface MarketplaceItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  seller: string;
  created_at: string;
}

interface ApiResponse {
  status: string;
  items?: MarketplaceItem[];
  item?: MarketplaceItem;
  error?: string;
  message?: string;
}

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL

export default function Marketplace() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editListing, setEditListing] = useState<Crop | null>(null);
  const [newCrop, setNewCrop] = useState<Crop>({
    id: Date.now(),
    crop: "",
    quantity: "",
    price: "",
    location: "",
    delivery: "Available",
    image: "",
  });

  const [imageData, setImageData] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  // Fetch crops from backend
  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      console.log('Fetching crops from:', `${API_BASE_URL}/marketplace/items`);
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/marketplace/items`);
      console.log('Response received:', response.data);
      
      if (response.data.items) {
        const transformedCrops = response.data.items.map((item) => ({
          id: item.id,
          crop: item.name,
          quantity: "1 unit", // Default value since backend doesn't have quantity
          price: `₹${item.price}`,
          location: item.seller || "Anonymous",
          delivery: "Available",
          image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80" // Default image
        }));
        setCrops(transformedCrops);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching crops:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: any; status?: number } };
        console.error('Error details:', {
          message: errorMessage,
          response: axiosError.response?.data,
          status: axiosError.response?.status
        });
      }
      setError(`Failed to fetch marketplace items: ${errorMessage}`);
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  // Handle input changes for new crop
  const handleNewCropChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewCrop({ ...newCrop, [event.target.name]: event.target.value });
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
        setNewCrop({ ...newCrop, image: reader.result as string });
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  // Add crop to marketplace
  const addCrop = async () => {
    if (!newCrop.crop || !newCrop.quantity || !newCrop.price || !newCrop.location) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      // Transform frontend data to match backend structure
      const backendData = {
        name: newCrop.crop,
        description: `${newCrop.quantity} available at ${newCrop.location}`,
        price: parseFloat(newCrop.price.replace('₹', '')),
        category: "crops",
        seller: newCrop.location
      };

      const response = await axios.post<ApiResponse>(`${API_BASE_URL}/marketplace/items`, backendData);
      
      if (response.data.item) {
        // Transform backend response to match frontend structure
        const newItem = {
          id: response.data.item.id,
          crop: response.data.item.name,
          quantity: newCrop.quantity,
          price: newCrop.price,
          location: newCrop.location,
          delivery: newCrop.delivery,
          image: newCrop.image || "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80"
        };

        setCrops([...crops, newItem]);
        resetForm();
      }
    } catch (err) {
      console.error('Error adding crop:', err);
      setError("Failed to add new crop");
    }
  };

  // Reset the form
  const resetForm = () => {
    setNewCrop({
      id: Date.now(),
      crop: "",
      quantity: "",
      price: "",
      location: "",
      delivery: "Available",
      image: ""
    });
    setImageData("");
    setShowModal(false);
  };

  // Handle editing crop details
  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editListing) return;
    setEditListing({ ...editListing, [event.target.name]: event.target.value });
  };

  // Save edited details
  const saveEdit = async () => {
    if (!editListing) return;

    try {
      // Transform frontend data to match backend structure
      const backendData = {
        name: editListing.crop,
        description: `${editListing.quantity} available at ${editListing.location}`,
        price: parseFloat(editListing.price.replace('₹', '')),
        category: "crops",
        seller: editListing.location
      };

      await axios.put(`${API_BASE_URL}/marketplace/items/${editListing.id}`, backendData);
      
      setCrops(crops.map((crop) => (crop.id === editListing.id ? editListing : crop)));
      setEditListing(null);
    } catch (err) {
      console.error('Error updating crop:', err);
      setError("Failed to update crop details");
    }
  };

  // Filter crops based on search query
  const filteredCrops = crops.filter((crop) =>
    crop.crop.toLowerCase().includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Farmer's Marketplace</h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search crops..."
                value={searchQuery}
                onChange={handleSearch}
                className="border rounded-lg px-4 py-2 pr-10 w-full md:w-72"
              />
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-500" />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors w-full md:w-auto"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> Add Crop
            </button>
          </div>
        </div>

        {/* Crop Listings */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img src={listing.image} alt={listing.crop} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{listing.crop}</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.quantity}</span>
                  </div>
                  <div className="flex items-center">
                    <IndianRupee className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.price}</span>
                  </div>
                  <div className="flex items-center">
                    <Store className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.delivery}</span>
                  </div>
                </div>
                <button
                  className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setEditListing(listing)}
                >
                  Edit
                </button>

                {editListing && editListing.id === listing.id && (
                  <div className="mt-4 space-y-2">
                    <input
                      type="text"
                      name="price"
                      value={editListing.price}
                      onChange={handleEditChange}
                      className="border p-2 rounded w-full"
                      placeholder="New Price"
                    />
                    <input
                      type="text"
                      name="quantity"
                      value={editListing.quantity}
                      onChange={handleEditChange}
                      className="border p-2 rounded w-full"
                      placeholder="New Quantity"
                    />
                    <button
                      onClick={saveEdit}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Crop Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New Crop</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Crop Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name *</label>
                <input
                  type="text"
                  name="crop"
                  value={newCrop.crop}
                  onChange={handleNewCropChange}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g., Organic Tomatoes"
                  required
                />
              </div>
              
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="text"
                  name="quantity"
                  value={newCrop.quantity}
                  onChange={handleNewCropChange}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g., 500 kg"
                  required
                />
              </div>
              
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="text"
                  name="price"
                  value={newCrop.price}
                  onChange={handleNewCropChange}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g., ₹200/kg"
                  required
                />
              </div>
              
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Location *</label>
                <input
                  type="text"
                  name="location"
                  value={newCrop.location}
                  onChange={handleNewCropChange}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g., Green Valley Farm"
                  required
                />
              </div>
              
              {/* Delivery Option */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Option</label>
                <select
                  name="delivery"
                  value={newCrop.delivery}
                  onChange={handleNewCropChange}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="Available">Available</option>
                  <option value="Pickup only">Pickup only</option>
                  <option value="Delivery within 50km">Delivery within 50km</option>
                  <option value="Free delivery above ₹5000">Free delivery above ₹5000</option>
                </select>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                {imageData && (
                  <div className="mt-2">
                    <img src={imageData} alt="Preview" className="h-24 object-cover rounded" />
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={addCrop}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Crop
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}