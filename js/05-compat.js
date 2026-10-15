// ═══ THE RENDERER'S VERSION (v80 S822, card F1) ═══════════════════════════════════════════════════════════════════
// One page loads one three.js, chosen in index.html's head script before this file runs: r128 from cdnjs (the old look,
// the default, exactly as before) or vendor/three.r170.min.js (`?look=new`, or the setting `og.renderer`), the classic
// build of 0.170 that scripts/three_bundle.py makes. Every other file is one code path for both; what differs between
// the two versions is settled here, and nowhere else.
// On 0.170 this file puts back what r128 did, so the same scene looks the same:
//  - colour management off and the output linear, as r128's defaults were (0.170 converts hex and output colours by default);
//  - the legacy light scale: r128 multiplied every light's irradiance by π, and its point lights fell off as
//    (1 − d/distance)^decay with a decay of 1, where 0.170 is physical (1/d², and no π). The light chunks are patched;
//  - `skinning: true` on a material, which r128 needs and 0.170 refuses (`SKINNED`, spread into the two skinned materials).
// What is left the same in both, and why it matters: a shadow pass still tests an object's layers against the eye's camera
// (WebGLShadowMap's renderObject, both versions), so the townsfolk's swap inside REN.shadowMap.render still holds.
const THREE_LEGACY=THREE.REVISION==='128';
const SKINNED=THREE_LEGACY?{skinning:true}:{};
if(!THREE_LEGACY){
  THREE.ColorManagement.enabled=false;
  {const SC=THREE.ShaderChunk;
    const swap=(chunk,a,b)=>{const s=SC[chunk];if(s.split(a).length!==2)throw new Error('05-compat: '+chunk+' has changed; cannot patch "'+a.slice(0,40)+'"');SC[chunk]=s.replace(a,b);};
    swap('lights_pars_begin','vec3 irradiance = ambientLightColor;\n\treturn irradiance;','vec3 irradiance = ambientLightColor;\n\treturn irradiance * PI;');
    swap('lights_pars_begin','vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n\t\treturn irradiance;',
      'vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n\t\treturn irradiance * PI;');
    swap('lights_pars_begin','light.color = directionalLight.color;','light.color = directionalLight.color * PI;');
    swap('lights_pars_begin','light.color = pointLight.color;','light.color = pointLight.color * PI;');
    swap('lights_pars_begin','light.color = spotLight.color * spotAttenuation;','light.color = spotLight.color * spotAttenuation * PI;');
    swap('lights_pars_begin','float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\n\tif ( cutoffDistance > 0.0 ) {\n\t\tdistanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\n\t}\n\treturn distanceFalloff;',
      'if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {\n\t\treturn pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );\n\t}\n\treturn 1.0;');}
  {const PL=THREE.PointLight,SL=THREE.SpotLight,WR=THREE.WebGLRenderer;
    THREE.PointLight=class PointLight extends PL{constructor(c,i,d,decay=1){super(c,i,d,decay);}};
    THREE.SpotLight=class SpotLight extends SL{constructor(c,i,d,a,p,decay=1){super(c,i,d,a,p,decay);}};
    THREE.WebGLRenderer=class WebGLRenderer extends WR{constructor(o){super(o);this.outputColorSpace=THREE.LinearSRGBColorSpace;}};}
  // S879 (F2a; the critic, 14 Oct): 0.170 gives a SkinnedMesh its own bounding sphere, computed once from the posed vertices through
  // the bones' world matrices, so it is already in world coordinates; the frustum test then applies matrixWorld a second time and
  // every townsperson at x, z ≈ 13,000–25,000 was culled. r128 culled them by the geometry's sphere in local space, which the
  // builders already pad for a raised arm or a stride (32-people.js, ×1.35): do the same.
  {const SM=THREE.SkinnedMesh.prototype;
    SM.computeBoundingSphere=function(){const g=this.geometry;if(!g.boundingSphere)g.computeBoundingSphere();
      if(!this.boundingSphere)this.boundingSphere=new THREE.Sphere();this.boundingSphere.copy(g.boundingSphere);return this.boundingSphere;};
    SM.computeBoundingBox=function(){const g=this.geometry;if(!g.boundingBox)g.computeBoundingBox();
      if(!this.boundingBox)this.boundingBox=new THREE.Box3();this.boundingBox.copy(g.boundingBox);return this.boundingBox;};}
}
