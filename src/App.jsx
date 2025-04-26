import axios from "axios";
import "./App.css";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleX, Code, Download, LoaderCircle, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

// Função para buscar os dados da API (unchanged)
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

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["posts", inputValue],
    queryFn: () => fetchQRCode(inputValue),
    enabled: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

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
        }
      } catch (err) {
        setQrCode("Erro ao gerar QR code:", err)
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const funcaoModalQrCodesGerados = () => {
    setModalQrCodesGerados(!modalQrCodesGerados);
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrcode, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = inputValue.slice(8) + ".png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar o QR code:", error);
      alert("Não foi possível baixar o QR code. Tente novamente.");
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      {/* Header with entrance animation */}
      <header
        className="text-slate-200 border-b border-slate-800 shadow-sm flex w-full h-20 justify-between items-center p-5 bg-slate-900"
      >
        <div className="flex items-center gap-2">
          <motion.img
            src="/images/zappiQR.png"
            className="w-12 h-12"
            alt="logo ZappiQR"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          <h1 className="font-inter text-2xl font-bold text-yellow-300">ZappiQR</h1>
        </div>
        <ul className="flex gap-2">
          <a
            target="_blank"
            href="https://github.com/Guikino/qrcode-generator"
            rel="noopener noreferrer"
          >
            <motion.li
              className="hover:bg-slate-800 font-poppins p-2 flex gap-2 rounded-md transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Code/>
              Código fonte
            </motion.li>
          </a>
          <motion.li
            onClick={funcaoModalQrCodesGerados}
            className="hover:bg-slate-800 cursor-pointer flex gap-2 font-poppins p-2 rounded-md transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          > <QrCode/>
            QR codes gerados
          </motion.li>
        </ul>
      </header>

      <main className="text-slate-200 grid grid-cols-3 text-center flex-1 w-full">
        <section className="flex items-center justify-center flex-col col-span-2 h-full">
        <motion.h1
  initial={{ opacity: 0, y: -50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  className="text-running-light font-inter text-4xl md:text-5xl font-bold mb-4 text-center"
>
  Gerador de QR Code
</motion.h1>


          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg italic font-poppins text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-blue-300 to-slate-400"
          >
            Crie QR Codes personalizados para links de forma prática
          </motion.p>
        </section>

        <section className="bg-slate-900 pt-4 px-4 relative h-[99%] flex flex-col justify-between rounded-md rounded-t-none border-l border-yellow-400">
          <div className="flex justify-center items-center flex-1">
            <AnimatePresence>
              {qrcode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                >
                  <img
                    src={qrcode}
                    alt="QR Code gerado"
                    className="max-w-full m-auto h-auto shadow-md shadow-gray-900"
                  />
                  <motion.button
                    onClick={downloadQRCode}
                    className="mt-4 block bg-yellow-500 shadow-sm shadow-gray-900 text-white m-auto font-bold py-2 px-6 rounded-md"
                    whileHover={{ scale: 1.05, backgroundColor: "#facc15" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Download/>
                  </motion.button>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-slate-800 p-2 rounded-md w-80 border border-yellow-400"
            >
              <div className="flex justify-end text-white">
                <motion.button
                  className="hover:text-yellow-500"
                  onClick={closeModal}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CircleX />
                </motion.button>
              </div>
              <h2 className="text-xl text-center font-inter font-bold text-yellow-300 mb-4">
                URL Inválida
              </h2>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-slate-800 p-2 pt-0 text-center rounded-md w-80 border border-yellow-400"
            >
              <div className="flex justify-end py-1 text-white hover:text-yellow-500">
                <motion.button
                  onClick={funcaoModalQrCodesGerados}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CircleX />
                </motion.button>
              </div>
              <span className="text-white font-poppins text-sm font-normal text-center">
                aba indisponível no momento 😭
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;