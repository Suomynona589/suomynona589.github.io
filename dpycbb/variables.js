var Variables = (function () {
  var store = {};

  function normalizeName(name) {
    return name.trim();
  }

  function getScopeValue(scope, ctx) {
    if (!scope) return null;
    if (scope === "user.id") {
      if (ctx && ctx.message && ctx.message.author) return String(ctx.message.author.id);
      if (ctx && ctx.interaction && ctx.interaction.user) return String(ctx.interaction.user.id);
      return null;
    }
    if (scope === "channel.id") {
      if (ctx && ctx.message && ctx.message.channel) return String(ctx.message.channel.id);
      if (ctx && ctx.interaction && ctx.interaction.channel) return String(ctx.interaction.channel.id);
      return null;
    }
    if (scope === "guild.id") {
      if (ctx && ctx.message && ctx.message.guild) return String(ctx.message.guild.id);
      if (ctx && ctx.interaction && ctx.interaction.guild) return String(ctx.interaction.guild.id);
      return null;
    }
    if (scope === "message.id") {
      if (ctx && ctx.message) return String(ctx.message.id);
      return null;
    }
    return scope;
  }

  function ensureVar(name, type) {
    if (!store[name]) {
      if (type === "list") store[name] = {};
      else store[name] = {};
    }
  }

  function ensureScope(name, scopeKey, type) {
    if (!store[name][scopeKey]) {
      if (type === "list") store[name][scopeKey] = [];
      else store[name][scopeKey] = "";
    }
  }

  function setVarBlock(block, ctx) {
    var name = normalizeName(block.variable);
    var method = block.method;
    var value = block.value;
    var type = block.type || "value";
    var scopeKey = getScopeValue(block.scope, ctx);

    ensureVar(name, type);

    if (scopeKey === null) {
      scopeKey = "_global";
    }

    ensureScope(name, scopeKey, type);

    if (type === "list") {
      if (method === "append") {
        store[name][scopeKey].push(value);
      } else if (method === "prepend") {
        store[name][scopeKey].unshift(value);
      } else if (method === "remove") {
        var idx = store[name][scopeKey].indexOf(value);
        if (idx !== -1) store[name][scopeKey].splice(idx, 1);
      } else if (method === "overwrite") {
        store[name][scopeKey] = [value];
      }
      return;
    }

    if (method === "overwrite") {
      store[name][scopeKey] = value;
      return;
    }

    if (method === "append") {
      store[name][scopeKey] = String(store[name][scopeKey]) + String(value);
      return;
    }

    if (method === "prepend") {
      store[name][scopeKey] = String(value) + String(store[name][scopeKey]);
      return;
    }

    if (method === "increment") {
      var n = Number(store[name][scopeKey]) || 0;
      store[name][scopeKey] = String(n + Number(value));
      return;
    }

    if (method === "decrement") {
      var n2 = Number(store[name][scopeKey]) || 0;
      store[name][scopeKey] = String(n2 - Number(value));
      return;
    }
  }

  function deleteVar(name) {
    if (name.includes("[")) {
      var base = name.split("[")[0];
      var inside = name.split("[")[1].split("]")[0];
      if (store[base] && store[base][inside]) {
        delete store[base][inside];
      }
      return;
    }
    if (store[name]) delete store[name];
  }

  function getVar(name, ctx) {
    if (name.includes("[")) {
      var base = name.split("[")[0];
      var inside = name.split("[")[1].split("]")[0];
      if (store[base] && store[base][inside] !== undefined) {
        return store[base][inside];
      }
      return "";
    }
    if (store[name] && store[name]["_global"] !== undefined) {
      return store[name]["_global"];
    }
    return "";
  }

  function replaceVariables(text, ctx) {
    return text.replace(/\{\{([^}]+)\}\}/g, function (_, name) {
      return String(getVar(name.trim(), ctx));
    });
  }

  return {
    setVarBlock: setVarBlock,
    deleteVar: deleteVar,
    getVar: getVar,
    replaceVariables: replaceVariables,
    _store: store
  };
})();
