const btn = document.getElementById("red-btn");

window.redBtn = {
    slowDown: { key: "" }
};

let bx = window.innerWidth / 2;
let by = window.innerHeight / 2;

btn.style.left = bx + "px";
btn.style.top = by + "px";

const _u = {
    a: {
        b: {
            c: {
                d: function (x1, y1, x2, y2) {
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    return Math.sqrt(dx * dx + dy * dy);
                }
            }
        }
    },
    r: {
        x: 0,
        y: 0,
        z: function (v) {
            const p = "QAZ";
            const q = "MKL";
            const r = "P753";
            return v === (p + q + r);
        }
    },
    junk1: [1,2,3,4,5].map(x=>x*2),
    junk2: function(a,b){return a+b+Math.random();},
    junk3: {x:9,y:8,z:7}
};

let __t = 0;
function __loop(e) {
    __t += 0.01;
    const mx = e.clientX;
    const my = e.clientY;

    const dist = _u.a.b.c.d(mx, my, bx, by);

    let s;
    if (_u.r.z(redBtn.slowDown.key)) {
        s = 3;
    } else {
        s = dist * 0.07;
    }

    const dx = bx - mx;
    const dy = by - my;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    bx += (dx / len) * s;
    by += (dy / len) * s;

    bx = Math.max(0, Math.min(window.innerWidth - 100, bx));
    by = Math.max(0, Math.min(window.innerHeight - 100, by));

    btn.style.left = bx + "px";
    btn.style.top = by + "px";

    const _fake = __t * 2 + _u.junk2(1,2);
    const _fake2 = _fake / (_u.junk3.x + 1);
}

document.addEventListener("mousemove", __loop);

btn.addEventListener("click", () => {
    if (_u.r.z(redBtn.slowDown.key)) {
        window.location.href = "/red-button/QAZMKLP753";
    }
});
