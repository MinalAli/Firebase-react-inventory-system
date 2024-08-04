'use client';
import { useState, useEffect, useRef } from "react";
import { firestore } from "@/firebase";
import { storage, ref, uploadBytes, getDownloadURL } from "@/firebase";
import { Box, Typography, Button, Modal, TextField, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, makeStyles} from "@mui/material";
import { Edit, Delete, Close } from '@mui/icons-material';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc, addDoc, Firestore } from 'firebase/firestore';
import { Camera } from "react-camera-pro";
import {Snackbar, Alert} from '@mui/material';

 

const globalStyles = {
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  bgcolor: '#f3e5f5',
  color: '#333',
};

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const buttonStyle = {
  backgroundColor: '#6a0dad',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#5b0bb5',
  },
}

const tableHeaderStyle = {
  backgroundColor: '#4c0070',
  color: '#fff',
  fontWeight: 'bold',
}

const tableCellStyle = {
  fontSize: '16px',
}

const iconButtonStyle = {
  '&:hover': {
    color: '#6a0dad',
  },
}

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(4);
  const cameraRef = useRef(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item, quantity = 1) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity: existingQuantity } = docSnap.data();
      await setDoc(docRef, { quantity: existingQuantity + quantity });
    } else {
      await setDoc(docRef, { quantity });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    await deleteDoc(docRef);
    await updateInventory();
  };

  const updateItem = async (oldName, newName, quantity) => {
    if (oldName !== newName) {
      await removeItem(oldName);
      await addItem(newName, quantity);
    } else {
      const docRef = doc(collection(firestore, 'inventory'), newName);
      await setDoc(docRef, { quantity });
    }
    await updateInventory();
    handleClose();
  };

  useEffect(() => {
    if (firestore) {
      updateInventory();
    }
  }, [firestore]);

  const handleOpen = (item = null) => {
    if (item) {
      setEditMode(true);
      setCurrentItem(item);
      setItemName(item.name);
      setItemQuantity(item.quantity);
    } else {
      setEditMode(false);
      setItemName('');
      setItemQuantity(1);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setItemName('');
    setItemQuantity(1);
    setEditMode(false);
    setCurrentItem(null);
  };

  const filteredInventory = inventory.filter(({ name }) => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCapture = async () => {
    if (capturedImage) {
      const imageRef = ref(storage, `images/${Date.now()}.png`);
  
      try {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
  
        await uploadBytes(imageRef, blob);
        const downloadURL = await getDownloadURL(imageRef);
  
        await addDoc(collection(firestore, 'images'), {
          url: downloadURL,
          createdAt: new Date(),
        });
  
        console.log('Image uploaded and URL saved:', downloadURL);
        
        // Show success message
        setSnackbarMessage('Image uploaded successfully!');
        setSnackbarOpen(true);
  
        // Reset camera
        setCapturedImage(null);
        if (cameraRef.current && cameraRef.current.resetCamera) {
          cameraRef.current.resetCamera();
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        // Show error message
        setSnackbarMessage('Error uploading image. Please try again.');
        setSnackbarOpen(true);
      }
    }
    setCameraOpen(false);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
      padding={3}
      sx={globalStyles}
    >
      <Typography variant="h3" sx={{ color: '#4c0070', fontWeight: 'bold', marginBottom: 2 }}>
        AI Inventory System
      </Typography>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{ ...style, ...globalStyles, position: 'relative' }}>
          <IconButton 
            onClick={handleClose} 
            sx={{ position: 'absolute', top: 8, right: 8, color: '#333' }}
          >
            <Close />
          </IconButton>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ color: '#4c0070' }}>
            {editMode ? 'Edit Item' : 'Add Item'}
          </Typography>
          <Box width="100%" display={'flex'} flexDirection={'column'} gap={2}>
            <TextField
              id="outlined-basic"
              label="Item Name"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <TextField
              id="outlined-basic-quantity"
              label="Quantity"
              variant="outlined"
              type="number"
              fullWidth
              value={itemQuantity}
              onChange={(e) => setItemQuantity(parseInt(e.target.value))}
            />
            <Button
              variant="contained"
              sx={buttonStyle}
              onClick={() => {
                if (editMode && currentItem) {
                  updateItem(currentItem.name, itemName, itemQuantity);
                } else {
                  addItem(itemName, itemQuantity);
                }
                handleClose();
              }}
            >
              {editMode ? 'Update' : 'Add'}
            </Button>
          </Box>
        </Box>
      </Modal>
      <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
        <Button variant="contained" onClick={() => handleOpen()} sx={buttonStyle}>
          Add New Item
        </Button>
        <Button variant="contained" onClick={() => setCameraOpen(true)} sx={buttonStyle}>
          Capture Image
        </Button>
      </Box>
      <TextField
        id="search-field"
        label="Search"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ marginY: 2, maxWidth: '800px', bgcolor: '#ffffff' }}
      />
      <Box width="100%" maxWidth="800px" marginTop={3}>
        <TableContainer component={Paper} sx={{ borderRadius: '8px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeaderStyle}>
                  <Typography variant="h6">Name</Typography>
                </TableCell>
                <TableCell sx={tableHeaderStyle}>
                  <Typography variant="h6">Quantity</Typography>
                </TableCell>
                <TableCell sx={tableHeaderStyle}>
                  <Typography variant="h6">Action</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(({ name, quantity }) => (
                <TableRow key={name}>
                  <TableCell sx={tableCellStyle}>
                    <Typography variant="body1">
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={tableCellStyle}>
                    <Typography variant="body1">
                      {quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen({ name, quantity })} sx={iconButtonStyle}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => removeItem(name)} sx={iconButtonStyle}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[4, 8, 12]}
          component="div"
          count={filteredInventory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>

      {/* Camera Modal */}
      <Modal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        aria-labelledby="camera-modal-title"
        aria-describedby="camera-modal-description"
      >
        <Box
          sx={{
            ...style,
            ...globalStyles,
            width: '80vw',
            maxWidth: '500px',
            padding: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            id="camera-modal-title"
            variant="h6"
            component="h2"
            sx={{ color: '#4c0070', marginBottom: 2 }}
          >
            Capture Image
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: '300px',
              margin: '0 auto',
              position: 'relative',
              border: '2px solid #4c0070',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <Camera
              idealFacingMode="environment"
              onCameraError={(error) => console.error(error)}
              onCameraReady={() => console.log('Camera is ready')}
              ref={cameraRef}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
          <Box sx={{ width: '100%', maxHeight: '200px', overflow: 'auto', textAlign: 'center', marginTop: 2 }}>
            {capturedImage && (
              <>
                <Typography variant="body1" sx={{ color: '#4c0070', marginBottom: 2 }}>
                  Image captured!
                </Typography>
                <img
                  src={capturedImage}
                  alt="Captured"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </>
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
            <Button
              variant="contained"
              sx={buttonStyle}
              onClick={() => {
                const photo = cameraRef.current.takePhoto(); // Ensure takePhoto() is correctly implemented
                setCapturedImage(photo);
              }}
            >
              Click
            </Button>
            <Button
              variant="contained"
              sx={buttonStyle}
              onClick={handleCapture}
              disabled={!capturedImage}
            >
              Save Image
            </Button>
            <Button
              variant="contained"
              sx={buttonStyle}
              onClick={() => setCameraOpen(false)}
            >
              Close Camera
            </Button>
          </Box>
        </Box>
      </Modal>
      <Snackbar
  open={snackbarOpen}
  autoHideDuration={6000}
  onClose={handleSnackbarClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
    {snackbarMessage}
  </Alert>
</Snackbar>
    </Box>
  );
}

