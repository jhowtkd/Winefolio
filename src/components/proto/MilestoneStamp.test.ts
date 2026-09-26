import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MilestoneStamp, type MilestoneStampProps } from './MilestoneStamp.js';
import { GLYPHS } from './stamp-art/glyphs.js';
import { modelFor, type StampModel } from './stamp-art/model-for.js';
import { perforationHoles, PORTRAIT, ROUND } from './stamp-art/perforation.js';
import { postmarkDate, splitTitle } from './stamp-art/text.js';
import { STAMPS, stampById } from '../../domain/stamps/catalog.js';
import { faceValue } from '../../domain/stamps/rules.js';

const render = (props: MilestoneStampProps) => renderToStaticMarkup(createElement(MilestoneStamp, props));
const stamp = (id: string) => stampById(id)!;

describe('MilestoneStamp', () => {
  const byModel = new Map<StampModel, (typeof STAMPS)[number]>();
  for (const def of STAMPS) if (!byModel.has(modelFor(def))) byModel.set(modelFor(def), def);

  it('usa os oito modelos da spec', () => {
    assert.deepStrictEqual(
      [...byModel.keys()].sort(),
      ['azulejo', 'camafeu', 'deco', 'gravura', 'modernismo', 'paisagem', 'redondo', 'traco']
    );
  });

  it('todo modelo desenha a caixa 240, o valor facial e WINEFOLIO, sem <use>', () => {
    for (const [model, def] of byModel) {
      const svg = render({ def, status: 'earned' });
      assert.ok(svg.includes('viewBox="0 0 240 240"'), model);
      assert.ok(svg.includes('WINEFOLIO'), model);
      assert.ok(svg.includes(`>${faceValue(def)}</text>`), model);
      assert.ok(!svg.includes('<use'), model);
      assert.ok(svg.includes('feTurbulence'), model);
    }
  });

  it('cada instância tem ids próprios para máscara e filtros', () => {
    const svg = renderToStaticMarkup(
      createElement('div', null, [
        createElement(MilestoneStamp, { key: 'a', def: stamp('volume.1'), status: 'earned' }),
        createElement(MilestoneStamp, { key: 'b', def: stamp('volume.1'), status: 'earned' }),
      ])
    );
    const masks = [...svg.matchAll(/<mask id="([^"]+)"/g)].map((m) => m[1]);
    assert.strictEqual(masks.length, 2);
    assert.notStrictEqual(masks[0], masks[1]);
  });

  it('a variante compacta não tem grão, desgaste nem microtexto', () => {
    const svg = render({ def: stamp('uva.malbec.1'), status: 'earned', compact: true });
    assert.ok(!svg.includes('feTurbulence'));
    assert.ok(!svg.includes('WINEFOLIO'));
    assert.ok(svg.includes('Curioso de'));
  });

  it('carimbo postal mostra a data da conquista', () => {
    const svg = render({ def: stamp('pais.3'), status: 'earned', postmark: true, earnedAt: '2026-03-12' });
    assert.ok(svg.includes('12·03·26'));
  });

  it('secreto bloqueado não revela título, moto nem modelo', () => {
    const def = stamp('secreto.favoritos');
    const svg = render({ def, status: 'locked' });
    assert.ok(!svg.includes(def.title));
    assert.ok(!svg.includes(def.motto));
    assert.ok(!svg.includes('data-model'));
    assert.ok(svg.includes('?'));
  });

  it('todo glifo do catálogo existe', () => {
    for (const def of STAMPS) assert.ok(GLYPHS[def.glyph], `${def.id}: ${def.glyph}`);
  });
});

describe('modelFor', () => {
  it('herda o estilo do país da uva e da região', () => {
    assert.strictEqual(modelFor(stamp('uva.malbec.1')), 'paisagem');
    assert.strictEqual(modelFor(stamp('uva.tannat.1')), 'modernismo');
    assert.strictEqual(modelFor(stamp('uva.touriga-nacional.1')), 'azulejo');
    assert.strictEqual(modelFor(stamp('uva.chardonnay.1')), 'gravura');
    assert.strictEqual(modelFor(stamp('uva.alvarinho.1')), 'gravura');
    assert.strictEqual(modelFor(stamp('regiao.borgonha.1')), 'gravura');
    assert.strictEqual(modelFor(stamp('regiao.bordeaux.1')), 'traco');
    assert.strictEqual(modelFor(stamp('regiao.mendoza.1')), 'paisagem');
    assert.strictEqual(modelFor(stamp('regiao.serra-gaucha.1')), 'modernismo');
  });

  it('dá um modelo por família para os marcos fixos', () => {
    assert.strictEqual(modelFor(stamp('pais.3')), 'redondo');
    assert.strictEqual(modelFor(stamp('pais.casa')), 'modernismo');
    assert.strictEqual(modelFor(stamp('estilo.espumante')), 'deco');
    assert.strictEqual(modelFor(stamp('critica.exigente')), 'camafeu');
    assert.strictEqual(modelFor(stamp('volume.100')), 'redondo');
    assert.strictEqual(modelFor(stamp('legado.first')), 'redondo');
  });
});

describe('stamp art helpers', () => {
  it('serrilha com um furo em cada canto e passo perto de 11', () => {
    const holes = perforationHoles(PORTRAIT);
    assert.ok(holes.some((h) => h.cx === 32 && h.cy === 16));
    assert.ok(holes.some((h) => h.cx === 208 && h.cy === 224));
    assert.strictEqual(holes.length, 2 * Math.round(176 / 11) + 2 * Math.round(208 / 11));
    assert.strictEqual(perforationHoles(ROUND).length, Math.round((2 * Math.PI * 104) / 11));
  });

  it('data do carimbo sem fuso', () => {
    assert.strictEqual(postmarkDate('2026-01-01'), '01·01·26');
    assert.strictEqual(postmarkDate(null), '');
  });

  it('quebra o título sem cortar palavra', () => {
    assert.deepStrictEqual(splitTitle('Explorador dos Cabernets Francs', 16), ['Explorador dos', 'Cabernets Francs']);
    assert.deepStrictEqual(splitTitle('Um dois três quatro cinco seis', 5, 2), ['Um', 'dois três quatro cinco seis']);
  });
});
