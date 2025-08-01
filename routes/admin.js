const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { db } = require("../firebase/firebase");
const { checkAdminAuth } = require("../middleware/auth");
const axios = require("axios");
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  // Only allow fixed email
  if (email !== "admin@gmail.com") {
    return res.status(403).json({ message: "Unauthorized email" });
  }

  // Fetch admin document
  const snapshot = await db
    .collection("admin")
    .where("email", "==", email)
    .get();
  if (snapshot.empty) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const adminDoc = snapshot.docs[0];
  const adminData = adminDoc.data();

  // Compare plaintext password
  if (adminData.password !== password) {
    return res.status(401).json({ message: "Invalid password" });
  }

  // Generate JWT token
  const token = jwt.sign(
    { role: "admin", id: adminDoc.id },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ message: "Login successful", token });
});

const generateRandomId = () => Math.floor(1000 + Math.random() * 9000);
const generatePassword = () => Math.random().toString(36).slice(-8); // 8-char

router.post("/admin/vendors", checkAdminAuth, async (req, res) => {
  try {
    const { name, phone, location } = req.body;

    if (!name || !phone || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Generate random email + password
    const randomId = generateRandomId();
    const email = `vendor_${randomId}@venuemgmt.com`;
    const password = generatePassword();

    // 2. Save vendor document
    const newVendorRef = db.collection("vendors").doc(); // auto ID
    const vendorData = {
      name,
      email,
      phone,
      password,
      location,
      createdAt: new Date().toISOString(),
    };

    await newVendorRef.set(vendorData);

    // 3. Return login credentials
    res.status(201).json({
      message: "Vendor created successfully",
      vendorId: newVendorRef.id,
      login: {
        email,
        password,
      },
    });
  } catch (err) {
    console.error("Error creating vendor:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// router.post(
//   "/admin/vendors/:vendorId/turfs",
//   checkAdminAuth,
//   async (req, res) => {
//     try {
//       const { vendorId } = req.params;
//       const {
//         title,
//         address,
//         description,
//         timeSlots,
//         sports,
//         courts,
//         amenities,
//         rules,
//         images,
//       } = req.body;

//       // Validate required fields
//       if (
//         !title ||
//         !address ||
//         !description ||
//         !timeSlots ||
//         !sports ||
//         !courts ||
//         !amenities ||
//         !rules ||
//         !images
//       ) {
//         return res
//           .status(400)
//           .json({ message: "Missing required turf fields" });
//       }

//       // Check if vendor exists
//       const vendorRef = db.collection("vendors").doc(vendorId);
//       const vendorDoc = await vendorRef.get();

//       if (!vendorDoc.exists) {
//         return res.status(404).json({ message: "Vendor not found" });
//       }

//       // Prepare turf data
//       const turfData = {
//         title,
//         address,
//         description,
//         timeSlots, // [{ open: "06:00", close: "10:00" }, ...]
//         sports, // [{ name: "football", slotPrice: 500 }]
//         courts, // ["Court A", "Court B"]
//         amenities, // ["wifi", "parking", ...]
//         rules, // ["No food", "No smoking", ...]
//         images, // [URLs]
//         createdAt: new Date().toISOString(),
//       };

//       // Save turf under vendor's subcollection
//       const turfRef = await vendorRef.collection("turfs").add(turfData);

//       res.status(201).json({
//         message: "Turf added successfully",
//         turfId: turfRef.id,
//       });
//     } catch (error) {
//       console.error("Error adding turf:", error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// );

// router.post(
//   "/admin/vendors/:vendorId/turfs",
//   checkAdminAuth,
//   async (req, res) => {
//     try {
//       const { vendorId } = req.params;
//       const {
//         title,
//         address,
//         description,
//         timeSlots,
//         sports,
//         courts,
//         amenities,
//         rules,
//         images,
//       } = req.body;

//       if (
//         !title ||
//         !address ||
//         !description ||
//         !timeSlots ||
//         !sports ||
//         !courts ||
//         !amenities ||
//         !rules ||
//         !images
//       ) {
//         return res
//           .status(400)
//           .json({ message: "Missing required turf fields" });
//       }

//       // Check vendor exists
//       const vendorRef = db.collection("vendors").doc(vendorId);
//       const vendorDoc = await vendorRef.get();

//       if (!vendorDoc.exists) {
//         return res.status(404).json({ message: "Vendor not found" });
//       }

//       // 🌐 Geocode the address to get lat/lng
//       // 🌐 Geocode using maps.co (instead of Google)
// let location = null;

// try {
//   const encodedAddress = encodeURIComponent("Burdwan Railway Station,Burdwan");
//   console.log(encodedAddress); // 🔑 encode the full address
//   const geoUrl = `https://geocode.maps.co/search?q=${encodedAddress}&api_key=${process.env.MAPSCO_API_KEY}`;

//   const response = await axios.get(geoUrl);
//   const result = response.data && response.data.length > 0 ? response.data[0] : null;

//   if (result) {
//     location = {
//       latitude: parseFloat(result.lat),
//       longitude: parseFloat(result.lon),
//     };
//   }
// } catch (geoErr) {
//   console.warn("⚠️ maps.co geocoding failed:", geoErr.message);
// }

//       // Prepare turf data
//       const turfData = {
//         title,
//         address,
//         description,
//         timeSlots,
//         sports,
//         courts,
//         amenities,
//         rules,
//         images,
//         location: location || null,
//         createdAt: new Date().toISOString(),
//       };

//       // Save to Firestore
//       const turfRef = await vendorRef.collection("turfs").add(turfData);

//       res.status(201).json({
//         message: "Turf added successfully",
//         turfId: turfRef.id,
//       });
//     } catch (err) {
//       console.error("Error adding turf:", err);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// );

router.post(
  "/admin/vendors/:vendorId/turfs",
  checkAdminAuth,
  async (req, res) => {
    try {
      const { vendorId } = req.params;
      const {
        title,
        address,
        description,
        timeSlots,
        sports,
        courts,
        amenities,
        rules,
        images,
        cancellationHours = 0,
        featured = 0,
      } = req.body;

      if (
        !title ||
        !address ||
        !description ||
        !timeSlots ||
        !sports ||
        !courts ||
        !amenities ||
        !rules ||
        !images
      ) {
        return res
          .status(400)
          .json({ message: "Missing required turf fields" });
      }

      // 🔍 Step 1: Check vendor exists
      const vendorRef = db.collection("vendors").doc(vendorId);
      const vendorDoc = await vendorRef.get();

      if (!vendorDoc.exists) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // 📍 Step 2: Geocode the actual `address` from req.body (not hardcoded)
      let location = null;
      try {
        const encodedAddress = encodeURIComponent(address); // ✅ correct usage
        const geoUrl = `https://geocode.maps.co/search?q=${encodedAddress}&api_key=${process.env.MAPSCO_API_KEY}`;

        const response = await axios.get(geoUrl);
        const result =
          response.data && response.data.length > 0 ? response.data[0] : null;

        if (result) {
          location = {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          };
        } else {
          console.warn("⚠️ No valid geocode result for:", address);
        }
      } catch (geoErr) {
        console.warn("⚠️ maps.co geocoding failed:", geoErr.message);
      }

      // 🧾 Step 3: Prepare turf data
      const turfData = {
        title,
        address,
        description,
        timeSlots, // [{ open, close }]
        sports, // [{ name: "football", slotPrice: 500 }]
        courts, // ["Court A", "Court B"]
        amenities, // ["wifi", "parking", ...]
        rules, // ["No smoking", ...]
        images, // [URLs]
        location: location || null,
        createdAt: new Date().toISOString(),
        cancellationHours, // default 0 if not provided
        featured,
      };

      // 💾 Step 4: Save to Firestore
      const turfRef = await vendorRef.collection("turfs").add(turfData);

      res.status(201).json({
        message: "Turf added successfully",
        turfId: turfRef.id,
        turf: turfData, // ✅ include full saved data in response
      });
    } catch (err) {
      console.error("❌ Error adding turf:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/vendors/:id/turfs", async (req, res) => {
  try {
    const vendorId = req.params.id;

    // 1. Get vendor details
    const vendorRef = db.collection("vendors").doc(vendorId);
    const vendorDoc = await vendorRef.get();

    if (!vendorDoc.exists) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const vendorData = vendorDoc.data();

    // 2. Get turfs under this vendor
    const turfSnapshot = await vendorRef.collection("turfs").get();
    const turfs = [];

    turfSnapshot.forEach((doc) => {
      const turf = doc.data();

      // Calculate openTime, closeTime from all timeSlots
      const openTimes = turf.timeSlots.map((slot) => slot.open);
      const closeTimes = turf.timeSlots.map((slot) => slot.close);

      const openTime = openTimes.sort()[0];
      const closeTime = closeTimes.sort().reverse()[0];

      turfs.push({
        turfId: doc.id,
        title: turf.title,
        vendorName: vendorData.name,
        phone: vendorData.phone,
        location: vendorData.location,
        description: turf.description,
        courtsCount: turf.courts?.length || 0,
        openTime,
        closeTime,
        createdAt: turf.createdAt,
        thumbnail: turf.images?.[0] || null,
      });
    });

    res.status(200).json(turfs);
  } catch (error) {
    console.error("Error fetching turfs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/admin/turfs", checkAdminAuth, async (req, res) => {
  try {
    const vendorSnapshot = await db.collection("vendors").get();
    const allTurfs = [];

    for (const vendorDoc of vendorSnapshot.docs) {
      const vendorData = vendorDoc.data();
      const vendorId = vendorDoc.id;

      const turfSnapshot = await db
        .collection("vendors")
        .doc(vendorId)
        .collection("turfs")
        .get();

      turfSnapshot.forEach((turfDoc) => {
        const turf = turfDoc.data();

        // Get open/close time from timeSlots
        const openTimes = turf.timeSlots?.map((slot) => slot.open) || [];
        const closeTimes = turf.timeSlots?.map((slot) => slot.close) || [];

        const openTime = openTimes.length ? openTimes.sort()[0] : null;
        const closeTime = closeTimes.length
          ? closeTimes.sort().reverse()[0]
          : null;

        allTurfs.push({
          turfId: turfDoc.id,
          title: turf.title,
          vendorName: vendorData.name,
          phone: vendorData.phone,
          location: vendorData.location,
          description: turf.description,
          courtsCount: turf.courts?.length || 0,
          openTime,
          closeTime,
          createdAt: turf.createdAt,
          thumbnail: turf.images?.[0] || null,
        });
      });
    }

    res.status(200).json(allTurfs);
  } catch (err) {
    console.error("Error fetching all turfs:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put(
  "/admin/vendors/:vendorId/turfs/:turfId",
  checkAdminAuth,
  async (req, res) => {
    try {
      const { vendorId, turfId } = req.params;
      const updateData = req.body;

      const turfRef = db
        .collection("vendors")
        .doc(vendorId)
        .collection("turfs")
        .doc(turfId);

      const turfDoc = await turfRef.get();

      if (!turfDoc.exists) {
        return res.status(404).json({ message: "Turf not found" });
      }

      await turfRef.update(updateData);

      res.status(200).json({ message: "Turf updated successfully" });
    } catch (error) {
      console.error("Error updating turf:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/admin/vendors/:vendorId/turfs/:turfId",
  checkAdminAuth,
  async (req, res) => {
    try {
      const { vendorId, turfId } = req.params;

      const turfRef = db
        .collection("vendors")
        .doc(vendorId)
        .collection("turfs")
        .doc(turfId);

      const turfDoc = await turfRef.get();

      if (!turfDoc.exists) {
        return res.status(404).json({ message: "Turf not found" });
      }

      // ✅ Soft delete (flag as deleted)
      await turfRef.update({ deleted: true });

      res.status(200).json({ message: "Turf marked as deleted" });

      // ❌ Hard delete (only use if you're sure):
      // await turfRef.delete();
      // res.status(200).json({ message: "Turf deleted permanently" });
    } catch (error) {
      console.error("Error deleting turf:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/admin/turfs/rules", checkAdminAuth, async (req, res) => {
  try {
    const vendorSnapshot = await db.collection("vendors").get();
    const result = [];

    for (const vendorDoc of vendorSnapshot.docs) {
      const vendorId = vendorDoc.id;
      const turfSnapshot = await db
        .collection("vendors")
        .doc(vendorId)
        .collection("turfs")
        .get();

      turfSnapshot.forEach((turfDoc) => {
        const turf = turfDoc.data();
        if (turf.rules && Array.isArray(turf.rules)) {
          result.push({
            turfId: turfDoc.id,
            title: turf.title,
            rules: turf.rules,
          });
        }
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete(
  "/admin/vendors/:vendorId/turfs/:turfId/rules",
  checkAdminAuth,
  async (req, res) => {
    try {
      const { vendorId, turfId } = req.params;
      const { rulesToDelete } = req.body;

      if (!rulesToDelete || !Array.isArray(rulesToDelete)) {
        return res
          .status(400)
          .json({ message: "rulesToDelete must be an array" });
      }

      const turfRef = db
        .collection("vendors")
        .doc(vendorId)
        .collection("turfs")
        .doc(turfId);
      const turfDoc = await turfRef.get();

      if (!turfDoc.exists) {
        return res.status(404).json({ message: "Turf not found" });
      }

      const turfData = turfDoc.data();
      const updatedRules =
        turfData.rules?.filter((rule) => !rulesToDelete.includes(rule)) || [];

      await turfRef.update({ rules: updatedRules });

      res.status(200).json({
        message: "Rules deleted successfully",
        remainingRules: updatedRules,
      });
    } catch (error) {
      console.error("Error deleting rules:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/admin/turfs/amenities", checkAdminAuth, async (req, res) => {
  try {
    const vendorSnapshot = await db.collection("vendors").get();
    const result = [];

    for (const vendorDoc of vendorSnapshot.docs) {
      const vendorId = vendorDoc.id;
      const turfSnapshot = await db
        .collection("vendors")
        .doc(vendorId)
        .collection("turfs")
        .get();

      turfSnapshot.forEach((turfDoc) => {
        const turf = turfDoc.data();
        if (turf.amenities && Array.isArray(turf.amenities)) {
          result.push({
            turfId: turfDoc.id,
            title: turf.title,
            amenities: turf.amenities,
          });
        }
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching amenities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete(
  "/admin/vendors/:vendorId/turfs/:turfId/amenities",
  checkAdminAuth,
  async (req, res) => {
    try {
      const { vendorId, turfId } = req.params;
      const { amenitiesToDelete } = req.body;

      if (!amenitiesToDelete || !Array.isArray(amenitiesToDelete)) {
        return res
          .status(400)
          .json({ message: "amenitiesToDelete must be an array" });
      }

      const turfRef = db
        .collection("vendors")
        .doc(vendorId)
        .collection("turfs")
        .doc(turfId);
      const turfDoc = await turfRef.get();

      if (!turfDoc.exists) {
        return res.status(404).json({ message: "Turf not found" });
      }

      const turfData = turfDoc.data();
      const updatedAmenities =
        turfData.amenities?.filter((a) => !amenitiesToDelete.includes(a)) || [];

      await turfRef.update({ amenities: updatedAmenities });

      res.status(200).json({
        message: "Amenities deleted successfully",
        remainingAmenities: updatedAmenities,
      });
    } catch (error) {
      console.error("Error deleting amenities:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/admin/bookings/:bookingId", checkAdminAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const bookingDoc = await db.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const bookingData = bookingDoc.data();

    res.status(200).json({
      bookingId,
      ...bookingData,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/admin/bookings/summary", async (req, res) => {
  console.log("📥 Admin bookings summary route hit");

  try {
    const snapshot = await db.collection("bookings").get();
    console.log("📦 Total bookings found:", snapshot.size);

    if (snapshot.empty) {
      return res.status(404).json({ message: "No bookings found" });
    }

    let totalBookings = 0;
    let totalAmount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalBookings += 1;
      totalAmount += data.amount || 0;
    });

    res.status(200).json({ totalBookings, totalAmount });
  } catch (err) {
    console.error("🔥 Error fetching bookings:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/admin/all-bookings", checkAdminAuth, async (req, res) => {
  try {
    const snapshot = await db.collection("bookings").get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No bookings found" });
    }

    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({
        bookingId: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json({ total: bookings.length, bookings });
  } catch (err) {
    console.error("Error fetching all bookings:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/admin/users", checkAdminAuth, async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();

    if (usersSnap.empty) {
      return res.status(200).json({ users: [], message: "No users found." });
    }

    const users = usersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/admin/tax", checkAdminAuth, async (req, res) => {
  try {
    const { percentage } = req.body;

    if (percentage === undefined || percentage < 0) {
      return res.status(400).json({ message: "Invalid tax percentage" });
    }

    await db.collection("tax").doc("global").set({ percentage });

    res.status(200).json({
      message: "Tax rate updated successfully",
      percentage,
    });
  } catch (err) {
    console.error("Failed to set tax:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
