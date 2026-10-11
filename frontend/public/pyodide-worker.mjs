// Python Lab çalıştırıcısı: Pyodide (WebAssembly üzerinde CPython) bu modül Web Worker'ında yüklenir;
// böylece uzun süren ya da sonsuz döngüye giren kod arayüzü dondurmaz (Durdur → worker sonlandırılır).
// Not: klasik worker + importScripts bazı tarayıcılarda CDN betiğini engelliyor; ES modül importu sorunsuz.
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs';

const ready = (async () => {
  const { loadPyodide } = await import(PYODIDE);
  const py = await loadPyodide();
  await py.loadPackage(['numpy', 'matplotlib'], { messageCallback: () => {} });
  py.runPython(`
import io, base64, warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
import matplotlib
matplotlib.use("agg")
import matplotlib.pyplot as plt
plt.rcParams.update({"figure.figsize": (6.4, 3.6), "axes.grid": True, "grid.alpha": 0.3})

def _collect_figures():
    out = []
    for num in plt.get_fignums():
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=110, bbox_inches="tight")
        out.append(base64.b64encode(buf.getvalue()).decode())
    plt.close("all")
    return out
`);
  return py;
})();

ready.then(
  (py) => self.postMessage({ type: 'ready', version: py.version }),
  (err) => self.postMessage({ type: 'fatal', text: String(err && err.message ? err.message : err) }),
);

self.onmessage = async (event) => {
  const { id, code } = event.data;
  let py;
  try {
    py = await ready;
  } catch (err) {
    self.postMessage({ id, type: 'error', text: 'Python yüklenemedi: ' + String(err) });
    return;
  }
  py.setStdout({ batched: (text) => self.postMessage({ id, type: 'stdout', text }) });
  py.setStderr({ batched: (text) => self.postMessage({ id, type: 'stderr', text }) });
  try {
    await py.loadPackagesFromImports(code, { messageCallback: () => {} });
    const result = await py.runPythonAsync(code);
    const figures = py.runPython('_collect_figures()').toJs();
    let text = result === undefined || result === null ? null : String(result);
    // plt.title(...) gibi çizim çağrılarının dönüş değeri gürültüdür; gösterme.
    if (text && /^(\[?<matplotlib|Text\(|\[<|<Figure)/.test(text)) text = null;
    if (result && typeof result.destroy === 'function') result.destroy();
    self.postMessage({ id, type: 'done', result: text, figures: Array.from(figures) });
  } catch (err) {
    py.runPython('import matplotlib.pyplot as plt; plt.close("all")');
    self.postMessage({ id, type: 'error', text: String(err && err.message ? err.message : err) });
  }
};
