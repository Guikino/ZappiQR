import axios from "axios";
import "./App.css";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CircleX,
  Code,
  Download,
  LoaderCircle,
  QrCode,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Função para buscar os dados da API
const fetchQRCode = async (inputValue) => {
  try {
    const response = await axios.post(
      "https://qrcode-generator-u3pd.onrender.com/qrcode",
      { text: inputValue }
    );
    if (!response.data.url) {
      throw new Error("QR code não encontrado na resposta da API");
    }
    return response.data.url;
  } catch (error) {
    console.error("Erro na API:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

function App() {
  const [qrcode, setQrCode] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalQrCodesGerados, setModalQrCodesGerados] = useState(false);
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  //- Load QR codes from localStorage on mount with error handling and validation
  useEffect(() => {
    const savedQRCodes = localStorage.getItem("generatedQRCodes");
    if (savedQRCodes) {
      try {
        const parsedQRCodes = JSON.parse(savedQRCodes);
        if (Array.isArray(parsedQRCodes)) {
          const validQRCodes = parsedQRCodes.filter(
            (qr) => qr.id && qr.url && qr.qrCodeUrl && qr.createdAt
          );
          if (validQRCodes.length !== parsedQRCodes.length) {
            console.warn(
              "Some stored QR codes were invalid. Filtering them out."
            );
            localStorage.setItem(
              "generatedQRCodes",
              JSON.stringify(validQRCodes)
            );
          }
          setGeneratedQRCodes(validQRCodes);
        } else {
          console.warn(
            "Stored QR codes are not an array. Clearing localStorage."
          );
          localStorage.removeItem("generatedQRCodes");
        }
      } catch (error) {
        console.error("Failed to parse QR codes from localStorage:", error);
        localStorage.removeItem("generatedQRCodes");
      }
    }
  }, []);

  // Save QR codes to localStorage when generatedQRCodes changes, optimized to avoid unnecessary writes
  useEffect(() => {
    if (generatedQRCodes.length > 0) {
      localStorage.setItem(
        "generatedQRCodes",
        JSON.stringify(generatedQRCodes)
      );
    } else {
      localStorage.removeItem("generatedQRCodes");
    }
  }, [generatedQRCodes]);

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "generatedQRCodes") {
        if (event.newValue) {
          try {
            const parsedQRCodes = JSON.parse(event.newValue);
            if (Array.isArray(parsedQRCodes)) {
              setGeneratedQRCodes(parsedQRCodes);
            }
          } catch (error) {
            console.error("Failed to parse storage event data:", error);
          }
        } else {
          setGeneratedQRCodes([]);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const { error, isLoading, refetch } = useQuery({
    queryKey: ["posts", inputValue],
    queryFn: () => fetchQRCode(inputValue),
    enabled: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const showTemporaryNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(inputValue)) {
        setIsModalOpen(true);
        return;
      }
      try {
        const result = await refetch();
        if (result.isSuccess && result.data) {
          setQrCode(result.data);
          // Check if QR code already exists
          const exists = generatedQRCodes.some((qr) => qr.url === inputValue);
          if (!exists) {
            // Add new QR code to the generatedQRCodes array
            const newQRCode = {
              id: Date.now(),
              url: inputValue,
              qrCodeUrl: result.data,
              createdAt: new Date().toISOString(),
            };
            setGeneratedQRCodes((prev) => [newQRCode, ...prev]);
            showTemporaryNotification("QR Code gerado com sucesso!");
          } else {
            showTemporaryNotification(
              "Este QR Code já foi gerado anteriormente!"
            );
          }
        }
      } catch (err) {
        setQrCode("Erro ao gerar QR code:", err);
        showTemporaryNotification("Erro ao gerar QR Code. Tente novamente.");
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const funcaoModalQrCodesGerados = () => {
    setModalQrCodesGerados(!modalQrCodesGerados);
  };

  const downloadQRCode = async (qrCodeUrl, fileName) => {
    try {
      const response = await fetch(qrCodeUrl, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName + ".png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showTemporaryNotification("Download iniciado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar o QR code:", error);
      showTemporaryNotification(
        "Não foi possível baixar o QR code. Tente novamente."
      );
    }
  };

  const deleteQRCode = (id) => {
    setGeneratedQRCodes((prev) => prev.filter((qrCode) => qrCode.id !== id));
    showTemporaryNotification("QR Code removido com sucesso!");
  };

  const clearAllQRCodes = () => {
    setGeneratedQRCodes([]);
    localStorage.removeItem("generatedQRCodes");
    showTemporaryNotification("Todos os QR Codes foram removidos!");
  };

  const formatUrl = (url) => {
    return url.length > 30 ? url.substring(0, 30) + "..." : url;
  };

  return (
    <div className="h-screen bg-slate-950 flex max-md:h-svh flex-col relative">
      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 bg-yellow-400 text-slate-900 px-4 py-2 rounded-md shadow-lg z-50"
          >
            {notificationMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="text-slate-200 border-b border-slate-800 shadow-sm flex w-full h-20 justify-between items-center p-5 bg-slate-900">
        <div className="flex items-center gap-2 max-md:gap-1">
          <motion.img
            src="/images/zappiQR.png"
            className="w-12 h-12"
            alt="logo ZappiQR"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ duration: 0.3 }}
          />
          <h1 className="font-inter text-2xl font-bold text-yellow-300 max-md:text-xl">
            ZappiQR
          </h1>
        </div>
        <ul className="flex gap-2 max-md:gap-1">
          <a
            target="_blank"
            href="https://github.com/Guikino/ZappiQR"
            rel="noopener noreferrer"
          >
            <motion.li
              className="hover:bg-slate-800 font-poppins p-2 flex gap-2 rounded-md transition max-md:text-sm"
              whileHover={{ scale: 1.05, backgroundColor: "#1e293b" }}
              whileTap={{ scale: 0.95 }}
            >
              <Code className="w-6 h-6 max-md:w-8 max-md:h-8" />
              <span className="max-md:hidden">Código fonte</span>
            </motion.li>
          </a>
          <motion.li
            onClick={funcaoModalQrCodesGerados}
            className="hover:bg-slate-800 cursor-pointer flex gap-2 font-poppins p-2 rounded-md transition max-md:text-sm relative"
            whileHover={{ scale: 1.05, backgroundColor: "#1e293b" }}
            whileTap={{ scale: 0.95 }}
          >
            <QrCode className="w-6 h-6 max-md:w-8 max-md:h-8" />
            <span className="max-md:hidden">QR codes gerados</span>
            {generatedQRCodes.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
              >
                {generatedQRCodes.length}
              </motion.span>
            )}
          </motion.li>
        </ul>
      </header>

      <main className="text-slate-200 grid grid-cols-3 text-center flex-1 w-full max-md:grid-cols-1 max-md:p-5">
        <section className="flex items-center justify-center flex-col col-span-2 h-full">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-running-light font-inter text-4xl font-bold mb-4 text-center max-md:text-3xl"
          >
            Gerador de QR Code
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg italic font-poppins text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-blue-300 to-slate-400 max-md:text-lg"
          >
            Crie QR Codes personalizados para links de forma prática
          </motion.p>
        </section>

        <section className="bg-slate-900 pt-4 px-4 relative h-[99%] flex flex-col justify-between rounded-md rounded-t-none border-l border-yellow-400">
          <div className="flex justify-center items-center flex-1">
            <AnimatePresence mode="wait">
              {qrcode ? (
                <motion.div
                  key="qrcode"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <motion.img
                    src={qrcode}
                    alt="QR Code gerado"
                    className="max-w-full m-auto h-auto shadow-md shadow-gray-900"
                  />
                  <motion.button
                    onClick={() => downloadQRCode(qrcode, inputValue.slice(8))}
                    className="mt-4 bg-yellow-500 shadow-sm shadow-gray-900 text-white m-auto font-bold py-2 px-6 rounded-md flex items-center gap-2"
                    whileHover={{ scale: 1.05, backgroundColor: "#facc15" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Download size={20} />
                    <span>Download</span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-slate-500 text-center"
                >
                  <QrCode size={100} className="mx-auto opacity-20" />
                  <p className="mt-4 font-poppins text-sm">
                    Insira uma URL para gerar seu QR Code
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center justify-center gap-3 pb-8"
          >
            <div className="input-border-animation w-full">
              <motion.input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                type="text"
                placeholder="URL do site para transformar em QR code"
                className="text-slate-200 font-light font-poppins text-lg w-full p-3 rounded-md placeholder-slate-500 transition"
                whileFocus={{ scale: 1.02, borderColor: "#facc15" }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isLoading}
              className="bg-transparent text-white font-bold text-lg py-2 px-6 font-inter rounded-md border border-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <LoaderCircle />
                </motion.span>
              ) : (
                "Gerar"
              )}
            </motion.button>
          </form>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 mt-2"
            >
              Erro: {error.message}
            </motion.div>
          )}
        </section>
      </main>

      {/* Modal para URL inválida */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-slate-800 p-2 rounded-md w-80 border border-yellow-400"
            >
              <div className="flex justify-between text-white pb-4 p-2">
                <h2 className="text-xl text-center font-inter font-bold text-yellow-300 ">
                  URL Inválida
                </h2>
                <motion.button
                  className="hover:text-yellow-500"
                  onClick={closeModal}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CircleX />
                </motion.button>
              </div>

              <p className="text-slate-200 text-sm text-center font-poppins">
                Por favor, insira uma URL válida (ex: https://google.com).
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal com os QR codes gerados */}
      <AnimatePresence>
        {modalQrCodesGerados && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-slate-800 p-4 equilibrado-md w-full max-w-2xl rounded-md border border-yellow-400 max-h-[80vh] overflow-y-auto mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-inter font-bold text-yellow-300">
                  QR Codes Gerados
                </h2>
                <div className="flex items-center gap-2">
                  {generatedQRCodes.length > 0 && (
                    <motion.button
                      onClick={clearAllQRCodes}
                      className="text-white hover:text-red-500"
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      title="limpar tudo"
                    >
                      <Trash2 />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={funcaoModalQrCodesGerados}
                    className="text-white hover:text-yellow-500"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <CircleX />
                  </motion.button>
                </div>
              </div>

              {generatedQRCodes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-slate-200 text-center font-poppins py-10"
                >
                  <QrCode size={60} className="mx-auto opacity-20 mb-4" />
                  <p>Nenhum QR code gerado ainda.</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Gere seu primeiro QR code e ele será salvo automaticamente.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedQRCodes.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: index * 0.1, duration: 0.3 },
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-slate-700 p-3 rounded-md shadow-md relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-1">
                        <motion.button
                          onClick={() => deleteQRCode(item.id)}
                          className="text-slate-400 hover:text-red-500  "
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Trash2 className="" size={16} />
                        </motion.button>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-slate-200 text-sm font-poppins truncate mb-2 w-full">
                          {formatUrl(item.url)}
                        </p>
                        <motion.img
                          src={item.qrCodeUrl}
                          alt={`QR Code para ${item.url}`}
                          className="w-32 h-32 mx-auto"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.button
                          onClick={() =>
                            downloadQRCode(item.qrCodeUrl, item.url.slice(8))
                          }
                          className="mt-2 bg-yellow-500 text-white font-bold py-1 px-4 rounded-md mx-auto block flex items-center gap-1"
                          whileHover={{
                            scale: 1.05,
                            backgroundColor: "#facc15",
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Download size={16} />
                          <span>Download</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
